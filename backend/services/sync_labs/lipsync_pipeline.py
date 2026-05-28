"""Orchestrate demux → Azure temp URLs → Sync → download."""

from __future__ import annotations

import logging
import os
import uuid
from typing import Any

import httpx
from azure.storage.blob import BlobClient, ContentSettings

from services.media.ffmpeg_split import FfmpegSplitError, split_video_audio
from services.storage.ad_video_media_url import (
    LIPSYNC_INPUT_SAS_EXPIRY_HOURS,
    VIDEO_CONTAINER_NAME,
    signed_ad_video_blob_url,
)
from services.sync_labs.client import (
    SyncLabsError,
    create_lipsync_generation,
    download_output_url,
    wait_for_generation,
)
from services.sync_labs.config import sync_lipsync_model, sync_lipsync_sync_mode

logger = logging.getLogger(__name__)


def _storage_conn_str() -> str:
    conn = os.getenv("AZURE_STORAGE_CONNECTION_STRING", "").strip()
    if not conn:
        raise SyncLabsError("AZURE_STORAGE_CONNECTION_STRING is not configured")
    return conn


def _upload_temp_blob(blob_name: str, data: bytes, content_type: str) -> None:
    client = BlobClient.from_connection_string(
        conn_str=_storage_conn_str(),
        container_name=VIDEO_CONTAINER_NAME,
        blob_name=blob_name,
    )
    client.upload_blob(
        data,
        overwrite=True,
        content_settings=ContentSettings(content_type=content_type),
        max_concurrency=4,
    )


def _delete_temp_blob(blob_name: str) -> None:
    try:
        client = BlobClient.from_connection_string(
            conn_str=_storage_conn_str(),
            container_name=VIDEO_CONTAINER_NAME,
            blob_name=blob_name,
        )
        client.delete_blob()
    except Exception:
        logger.warning("Failed to delete temp blob %s", blob_name, exc_info=True)


async def lipsync_ad_video(muxed_mp4: bytes, *, variant_id: int) -> tuple[bytes, dict[str, Any]]:
    """Demux, call Sync ``sync-3``, return lip-synced MP4 bytes and meta fragment."""
    run_id = uuid.uuid4().hex
    prefix = f"lipsync-temp/{variant_id}/{run_id}"
    video_blob = f"{prefix}/video.mp4"
    audio_blob = f"{prefix}/audio.wav"
    model = sync_lipsync_model()
    sync_mode = sync_lipsync_sync_mode()

    try:
        try:
            video_bytes, audio_bytes = await split_video_audio(muxed_mp4)
        except FfmpegSplitError as exc:
            raise SyncLabsError(str(exc)) from exc

        _upload_temp_blob(video_blob, video_bytes, "video/mp4")
        _upload_temp_blob(audio_blob, audio_bytes, "audio/wav")

        video_url = signed_ad_video_blob_url(
            video_blob, expiry_hours=LIPSYNC_INPUT_SAS_EXPIRY_HOURS
        )
        audio_url = signed_ad_video_blob_url(
            audio_blob, expiry_hours=LIPSYNC_INPUT_SAS_EXPIRY_HOURS
        )

        generation_id: str | None = None
        # One shared httpx client: used by Sync SDK (passed through) and for outputUrl download.
        async with httpx.AsyncClient(
            timeout=httpx.Timeout(300.0, connect=30.0),
            follow_redirects=True,
        ) as httpx_client:
            generation_id = await create_lipsync_generation(
                video_url=video_url,
                audio_url=audio_url,
                model=model,
                sync_mode=sync_mode,
                httpx_client=httpx_client,
            )
            output_url = await wait_for_generation(
                generation_id,
                httpx_client=httpx_client,
            )
            output_bytes = await download_output_url(output_url, client=httpx_client)

        meta = {
            "applied": True,
            "model": model,
            "sync_generation_id": generation_id,
            "sync_mode": sync_mode,
        }
        logger.info(
            "Sync lipsync completed variant_id=%s generation_id=%s bytes=%s",
            variant_id,
            generation_id,
            len(output_bytes),
        )
        return output_bytes, meta
    finally:
        _delete_temp_blob(video_blob)
        _delete_temp_blob(audio_blob)
