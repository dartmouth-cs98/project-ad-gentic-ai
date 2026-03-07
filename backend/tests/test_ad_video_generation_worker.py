"""Unit tests for ad video generation worker — generate_ad_video with mocked OpenAI video client.

Requires: pytest-asyncio for async tests.
Run from the backend directory:
    cd backend && python -m pytest tests/test_ad_video_generation_worker.py -v
"""

import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

import pytest

from workers.ad_video_generation_worker.worker import generate_ad_video


# ---------------------------------------------------------------------------
# Tests — generate_ad_video (mocked video API)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_generate_ad_video_raises_when_env_not_configured():
    """generate_ad_video raises RuntimeError when script/video API key is missing or placeholder."""
    with patch.dict("os.environ", {"VIDEO_API_KEY": ""}, clear=False):
        with pytest.raises(RuntimeError, match="not configured"):
            await generate_ad_video(
                script="Script",
                product_image_bytes=b"img",
                product_image_type="image/png",
                product_image_filename="x.png",
            )

    with patch.dict("os.environ", {"VIDEO_API_KEY": "YOUR_API_KEY"}, clear=False):
        with pytest.raises(RuntimeError, match="not configured"):
            await generate_ad_video(
                script="Script",
                product_image_bytes=b"img",
                product_image_type="image/png",
                product_image_filename="x.png",
            )


@pytest.mark.asyncio
async def test_generate_ad_video_returns_bytes_when_mock_succeeds():
    """generate_ad_video calls video client and returns bytes from download_content."""
    fake_video_bytes = b"fake mp4 content"
    mock_download = MagicMock()
    mock_download.aread = AsyncMock(return_value=fake_video_bytes)

    mock_video_client = MagicMock()
    mock_creation = MagicMock()
    mock_creation.status = MagicMock(status="completed")
    mock_creation.id = "job-123"
    mock_video_client.videos.create = AsyncMock(return_value=mock_creation)
    mock_video_client.videos.retrieve = AsyncMock(return_value=MagicMock(status="completed"))
    mock_video_client.videos.download_content = AsyncMock(return_value=mock_download)

    with (
        patch("workers.ad_video_generation_worker.worker.AsyncOpenAI", return_value=mock_video_client),
        patch.dict("os.environ", {"VIDEO_API_KEY": "video-key"}, clear=False),
    ):
        result = await generate_ad_video(
            script="Short script",
            product_image_bytes=b"image bytes",
            product_image_type="image/png",
            product_image_filename="product.png",
        )

    assert result == fake_video_bytes
    mock_video_client.videos.create.assert_awaited_once()
    call_kw = mock_video_client.videos.create.await_args[1]
    assert call_kw["prompt"] == "Short script"
    assert call_kw["size"] == "720x1280"
    assert call_kw["seconds"] == 8
