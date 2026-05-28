"""Sync Labs Generate API wrapper using official Python SDK (syncsdk)."""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass
from typing import Any

import httpx
from sync import AsyncSync
from sync.common import Audio, GenerationOptions, Video
from sync.core.api_error import ApiError

from services.sync_labs.config import (
    sync_api_key,
    sync_base_url,
    sync_lipsync_max_poll_attempts,
    sync_lipsync_model,
    sync_lipsync_poll_interval_seconds,
    sync_lipsync_sync_mode,
    sync_lipsync_extra_options,
)

logger = logging.getLogger(__name__)

TERMINAL_STATUSES = frozenset({"COMPLETED", "FAILED", "REJECTED"})


class SyncLabsError(RuntimeError):
    """Sync API error."""


class SyncLabsAuthError(SyncLabsError):
    """Invalid or missing API key."""


@dataclass(frozen=True)
class SyncGeneration:
    id: str
    status: str
    output_url: str | None
    error: str | None
    error_code: str | None


def _sdk_client(*, httpx_client: httpx.AsyncClient | None = None) -> AsyncSync:
    api_key = sync_api_key()
    if not api_key:
        raise SyncLabsAuthError("SYNC_API_KEY is not configured")
    return AsyncSync(
        api_key=api_key,
        base_url=sync_base_url(),
        httpx_client=httpx_client,
    )


def _parse_sdk_generation(gen: Any) -> SyncGeneration:
    gen_id = getattr(gen, "id", None)
    status = getattr(gen, "status", None)
    if not isinstance(gen_id, str) or not gen_id.strip():
        raise SyncLabsError("Sync SDK returned generation with missing id")
    if status is None:
        raise SyncLabsError("Sync SDK returned generation with missing status")

    status_str = str(status)
    output_url = getattr(gen, "output_url", None)
    if output_url is not None and not isinstance(output_url, str):
        output_url = str(output_url)
    error = getattr(gen, "error", None)
    if error is not None and not isinstance(error, str):
        error = str(error)
    error_code = getattr(gen, "error_code", None)
    if error_code is not None and not isinstance(error_code, str):
        error_code = str(error_code)

    return SyncGeneration(
        id=gen_id.strip(),
        status=status_str,
        output_url=output_url,
        error=error,
        error_code=error_code,
    )


async def create_lipsync_generation(
    *,
    video_url: str,
    audio_url: str,
    model: str | None = None,
    sync_mode: str | None = None,
    extra_options: dict[str, Any] | None = None,
    httpx_client: httpx.AsyncClient | None = None,
    sync_client: Any | None = None,
) -> str:
    """Create a generation; returns generation id."""
    model_name = model or sync_lipsync_model()
    mode = sync_mode or sync_lipsync_sync_mode()
    options_dict: dict[str, Any] = {"sync_mode": mode}
    options_dict.update(sync_lipsync_extra_options())
    if extra_options:
        options_dict.update(extra_options)

    owns_httpx = httpx_client is None
    if owns_httpx:
        httpx_client = httpx.AsyncClient(timeout=httpx.Timeout(60.0, connect=30.0))
    owns_sync = sync_client is None
    if owns_sync:
        sync_client = _sdk_client(httpx_client=httpx_client)

    try:
        opts = GenerationOptions(**options_dict)
        gen = await sync_client.generations.create(
            model=model_name,
            input=[Video(url=video_url), Audio(url=audio_url)],
            options=opts,
        )
    except ApiError as exc:
        msg = getattr(exc, "body", None) or str(exc)
        raise SyncLabsError(f"Sync create generation failed: {msg}") from exc
    finally:
        if owns_httpx and httpx_client is not None:
            await httpx_client.aclose()

    generation = _parse_sdk_generation(gen)
    logger.info("Sync generation created: id=%s status=%s", generation.id, generation.status)
    return generation.id


async def get_generation(
    generation_id: str,
    *,
    httpx_client: httpx.AsyncClient | None = None,
    sync_client: Any | None = None,
) -> SyncGeneration:
    owns_httpx = httpx_client is None
    if owns_httpx:
        httpx_client = httpx.AsyncClient(timeout=httpx.Timeout(60.0, connect=30.0))
    owns_sync = sync_client is None
    if owns_sync:
        sync_client = _sdk_client(httpx_client=httpx_client)

    try:
        gen = await sync_client.generations.get(generation_id)
        return _parse_sdk_generation(gen)
    except ApiError as exc:
        msg = getattr(exc, "body", None) or str(exc)
        raise SyncLabsError(f"Sync get generation failed: {msg}") from exc
    finally:
        if owns_httpx and httpx_client is not None:
            await httpx_client.aclose()


async def wait_for_generation(
    generation_id: str,
    *,
    httpx_client: httpx.AsyncClient | None = None,
    sync_client: Any | None = None,
) -> str:
    """Poll until COMPLETED; return ``outputUrl``. Raises on failure/timeout."""
    owns_httpx = httpx_client is None
    if owns_httpx:
        httpx_client = httpx.AsyncClient(timeout=httpx.Timeout(120.0, connect=30.0))
    owns_sync = sync_client is None
    if owns_sync:
        sync_client = _sdk_client(httpx_client=httpx_client)

    try:
        interval = sync_lipsync_poll_interval_seconds()
        max_attempts = sync_lipsync_max_poll_attempts()
        for attempt in range(1, max_attempts + 1):
            generation = await get_generation(
                generation_id,
                httpx_client=httpx_client,
                sync_client=sync_client,
            )
            logger.info(
                "Sync generation poll %s/%s: id=%s status=%s",
                attempt,
                max_attempts,
                generation.id,
                generation.status,
            )
            if generation.status == "COMPLETED":
                if not generation.output_url:
                    raise SyncLabsError(
                        f"Sync generation {generation_id} completed without outputUrl"
                    )
                return generation.output_url
            if generation.status in ("FAILED", "REJECTED"):
                detail = generation.error or generation.error_code or generation.status
                raise SyncLabsError(f"Sync generation {generation_id} failed: {detail}")
            if generation.status not in TERMINAL_STATUSES:
                await asyncio.sleep(interval)
                continue
            raise SyncLabsError(
                f"Sync generation {generation_id} ended with unexpected status {generation.status!r}"
            )
        raise SyncLabsError(
            f"Sync generation {generation_id} did not complete within "
            f"{max_attempts * interval}s"
        )
    finally:
        if owns_httpx and httpx_client is not None:
            await httpx_client.aclose()


async def download_output_url(output_url: str, *, client: httpx.AsyncClient | None = None) -> bytes:
    owns_client = client is None
    if owns_client:
        client = httpx.AsyncClient(
            timeout=httpx.Timeout(300.0, connect=30.0),
            follow_redirects=True,
        )
    try:
        response = await client.get(output_url)
        if response.status_code >= 400:
            raise SyncLabsError(
                f"Sync output download failed ({response.status_code}): {output_url[:120]}"
            )
        return response.content
    finally:
        if owns_client:
            await client.aclose()
