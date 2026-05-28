"""Demux MP4 into silent video and WAV audio via ffmpeg."""

from __future__ import annotations

import asyncio
import logging
import os
import tempfile
from pathlib import Path

logger = logging.getLogger(__name__)

FFMPEG_SUBPROCESS_TIMEOUT_SECONDS = 120


class FfmpegSplitError(RuntimeError):
    """ffmpeg failed or is unavailable."""


async def split_video_audio(mp4_bytes: bytes) -> tuple[bytes, bytes]:
    """Return ``(video_mp4_no_audio, audio_wav)`` from a muxed MP4."""
    if not mp4_bytes:
        raise FfmpegSplitError("Empty MP4 input")

    with tempfile.TemporaryDirectory(prefix="adgentic-ffmpeg-") as tmp:
        tmp_path = Path(tmp)
        input_path = tmp_path / "input.mp4"
        video_path = tmp_path / "video_no_audio.mp4"
        audio_path = tmp_path / "audio.wav"
        input_path.write_bytes(mp4_bytes)

        await _run_ffmpeg(
            "-y",
            "-i",
            str(input_path),
            "-an",
            "-c:v",
            "copy",
            str(video_path),
        )
        await _run_ffmpeg(
            "-y",
            "-i",
            str(input_path),
            "-vn",
            "-ac",
            "1",
            "-ar",
            "44100",
            "-c:a",
            "pcm_s16le",
            str(audio_path),
        )

        if not video_path.is_file() or video_path.stat().st_size == 0:
            raise FfmpegSplitError("ffmpeg produced empty video output")
        if not audio_path.is_file() or audio_path.stat().st_size == 0:
            raise FfmpegSplitError(
                "ffmpeg produced empty audio output (source may have no audio track)"
            )

        return video_path.read_bytes(), audio_path.read_bytes()


async def _run_ffmpeg(*args: str) -> None:
    ffmpeg_bin = os.getenv("FFMPEG_PATH", "ffmpeg").strip() or "ffmpeg"
    try:
        proc = await asyncio.create_subprocess_exec(
            ffmpeg_bin,
            *args,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
    except FileNotFoundError as exc:
        raise FfmpegSplitError(
            f"{ffmpeg_bin} not found; install ffmpeg or set FFMPEG_PATH"
        ) from exc

    try:
        _stdout, stderr = await asyncio.wait_for(
            proc.communicate(),
            timeout=FFMPEG_SUBPROCESS_TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError as exc:
        proc.kill()
        raise FfmpegSplitError(
            f"ffmpeg timed out after {FFMPEG_SUBPROCESS_TIMEOUT_SECONDS}s"
        ) from exc

    if proc.returncode != 0:
        err_text = (stderr or b"").decode("utf-8", errors="replace")[-2000:]
        logger.error("ffmpeg failed (rc=%s): %s", proc.returncode, err_text)
        raise FfmpegSplitError(f"ffmpeg exited with code {proc.returncode}")
