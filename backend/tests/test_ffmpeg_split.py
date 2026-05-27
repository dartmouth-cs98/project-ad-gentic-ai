"""Tests for ffmpeg demux helper."""

import sys
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

from services.media.ffmpeg_split import FfmpegSplitError, split_video_audio


@pytest.mark.asyncio
async def test_split_video_audio_empty_input():
    with pytest.raises(FfmpegSplitError, match="Empty"):
        await split_video_audio(b"")


@pytest.mark.asyncio
async def test_split_video_audio_success():
    with patch(
        "services.media.ffmpeg_split._run_ffmpeg",
        new_callable=AsyncMock,
    ) as mock_run:

        async def write_outputs(*args: str) -> None:
            out = args[-1]
            if out.endswith("video_no_audio.mp4"):
                Path(out).write_bytes(b"video-bytes")
            elif out.endswith("audio.wav"):
                Path(out).write_bytes(b"audio-bytes")

        mock_run.side_effect = write_outputs
        video, audio = await split_video_audio(b"fake-muxed")
    assert video == b"video-bytes"
    assert audio == b"audio-bytes"
    assert mock_run.await_count == 2
