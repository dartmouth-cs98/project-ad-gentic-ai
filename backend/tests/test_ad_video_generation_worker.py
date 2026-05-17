"""Unit tests for ad video generation worker (OpenAI video + Google Veo paths).

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

from workers.ad_video_generation_worker.provider_selection import ProviderDecision
from workers.ad_video_generation_worker.worker import (
    DEFAULT_VEO_MODEL,
    allowed_video_seconds,
    generate_ad_video,
    generate_ad_video_for_script,
    generate_ad_video_google_veo,
    video_prompt_audio_prefix,
)


# ---------------------------------------------------------------------------
# Tests — generate_ad_video_for_script (routing)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_generate_ad_video_for_script_routes_to_veo_for_dialogue_script():
    dialogue_script = (
        "## Beat 1\n- Line (approx. word count): Hello there friend, this is a long spoken hook.\n"
        "## Beat 2\n- Line (approx. word count): And here is another full sentence of dialogue.\n"
        "## Beat 3\n- Line (approx. word count): Third beat keeps talking to camera for clarity.\n"
    )
    with (
        patch(
            "workers.ad_video_generation_worker.worker.choose_video_provider_with_reason",
            return_value=ProviderDecision(
                provider="veo",
                confidence=0.9,
                reason="test",
                features={},
                fallback_used=False,
            ),
        ),
        patch(
            "workers.ad_video_generation_worker.worker.generate_ad_video_google_veo",
            new_callable=AsyncMock,
            return_value=b"veo-bytes",
        ) as mock_veo,
        patch(
            "workers.ad_video_generation_worker.worker.generate_ad_video",
            new_callable=AsyncMock,
        ) as mock_sora,
        patch.dict(
            "os.environ",
            {"GEMINI_API_KEY": "g-key", "VIDEO_API_KEY": "v-key"},
            clear=False,
        ),
    ):
        out = await generate_ad_video_for_script(
            script=dialogue_script,
            product_image_bytes=b"i",
            product_image_type="image/png",
            product_image_filename="x.png",
        )

    assert out == b"veo-bytes"
    mock_veo.assert_awaited_once()
    mock_sora.assert_not_called()


@pytest.mark.asyncio
async def test_generate_ad_video_for_script_routes_to_sora_for_cinematic_script():
    cinematic_script = """
## Overview
Drone montage — ambient only.

## Beat 1
- Camera move: drone aerial, whip pan into macro slow motion
- Line (approx. word count): none — ambient only

## Beat 2
- Camera move: steadicam orbit tracking shot
- Line (approx. word count): none — ambient only
"""
    with (
        patch(
            "workers.ad_video_generation_worker.worker.choose_video_provider_with_reason",
            return_value=ProviderDecision(
                provider="sora",
                confidence=0.9,
                reason="test",
                features={},
                fallback_used=False,
            ),
        ),
        patch(
            "workers.ad_video_generation_worker.worker.generate_ad_video_google_veo",
            new_callable=AsyncMock,
        ) as mock_veo,
        patch(
            "workers.ad_video_generation_worker.worker.generate_ad_video",
            new_callable=AsyncMock,
            return_value=b"sora-bytes",
        ) as mock_sora,
        patch.dict(
            "os.environ",
            {"GEMINI_API_KEY": "g-key", "VIDEO_API_KEY": "v-key"},
            clear=False,
        ),
    ):
        out = await generate_ad_video_for_script(
            script=cinematic_script,
            product_image_bytes=b"i",
            product_image_type="image/png",
            product_image_filename="x.png",
        )

    assert out == b"sora-bytes"
    mock_sora.assert_awaited_once()
    mock_veo.assert_not_called()


@pytest.mark.asyncio
async def test_generate_ad_video_for_script_falls_back_when_preferred_missing():
    with (
        patch(
            "workers.ad_video_generation_worker.worker.choose_video_provider_with_reason",
            return_value=ProviderDecision(
                provider="veo",
                confidence=1.0,
                reason="test",
                features={},
                fallback_used=False,
            ),
        ),
        patch(
            "workers.ad_video_generation_worker.worker.generate_ad_video_google_veo",
            new_callable=AsyncMock,
        ) as mock_veo,
        patch(
            "workers.ad_video_generation_worker.worker.generate_ad_video",
            new_callable=AsyncMock,
            return_value=b"sora-fallback",
        ) as mock_sora,
        patch.dict("os.environ", {"GEMINI_API_KEY": "", "VIDEO_API_KEY": "v-key"}, clear=False),
    ):
        out = await generate_ad_video_for_script(
            script="any",
            product_image_bytes=b"i",
            product_image_type="image/png",
            product_image_filename="x.png",
        )

    assert out == b"sora-fallback"
    mock_sora.assert_awaited_once()
    mock_veo.assert_not_called()


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
    mock_creation.status = "completed"
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
    assert call_kw["seconds"] == allowed_video_seconds()
    assert call_kw["prompt"] == video_prompt_audio_prefix(call_kw["seconds"]) + "Short script"
    assert call_kw["size"] == "720x1280"


@pytest.mark.asyncio
async def test_generate_ad_video_raises_when_job_fails():
    """generate_ad_video raises RuntimeError when job ends in a terminal failure status."""
    mock_video_client = MagicMock()
    mock_creation = MagicMock()
    mock_creation.status = "failed"
    mock_creation.id = "job-fail-456"
    mock_video_client.videos.create = AsyncMock(return_value=mock_creation)

    with (
        patch("workers.ad_video_generation_worker.worker.AsyncOpenAI", return_value=mock_video_client),
        patch.dict("os.environ", {"VIDEO_API_KEY": "video-key"}, clear=False),
    ):
        with pytest.raises(RuntimeError, match="ended with status 'failed'"):
            await generate_ad_video(
                script="Script",
                product_image_bytes=b"img",
                product_image_type="image/png",
                product_image_filename="x.png",
            )


@pytest.mark.asyncio
async def test_generate_ad_video_raises_when_poll_timeout():
    """generate_ad_video raises RuntimeError when job does not complete within max wait time."""
    mock_video_client = MagicMock()
    mock_creation = MagicMock()
    mock_creation.status = "pending"
    mock_creation.id = "job-slow-789"
    mock_video_client.videos.create = AsyncMock(return_value=mock_creation)
    mock_video_client.videos.retrieve = AsyncMock(
        return_value=MagicMock(status="pending")
    )

    with (
        patch("workers.ad_video_generation_worker.worker.AsyncOpenAI", return_value=mock_video_client),
        patch("workers.ad_video_generation_worker.worker.MAX_POLL_ATTEMPTS", 2),
        patch("workers.ad_video_generation_worker.worker.POLL_INTERVAL_SECONDS", 0),
        patch.dict("os.environ", {"VIDEO_API_KEY": "video-key"}, clear=False),
    ):
        with pytest.raises(RuntimeError, match="did not complete within"):
            await generate_ad_video(
                script="Script",
                product_image_bytes=b"img",
                product_image_type="image/png",
                product_image_filename="x.png",
            )


# ---------------------------------------------------------------------------
# Tests — generate_ad_video_google_veo (mocked google-genai client)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_generate_ad_video_google_veo_raises_when_env_not_configured():
    with patch.dict("os.environ", {"GOOGLE_VEO_API_KEY": "", "GOOGLE_API_KEY": "", "GEMINI_API_KEY": ""}, clear=False):
        with pytest.raises(RuntimeError, match="Google Veo env vars not configured"):
            await generate_ad_video_google_veo(
                script="Script",
                product_image_bytes=b"img",
                product_image_type="image/png",
                product_image_filename="x.png",
            )

    with patch.dict(
        "os.environ",
        {
            "GOOGLE_VEO_API_KEY": "YOUR_API_KEY",
            "GOOGLE_API_KEY": "",
            "GEMINI_API_KEY": "",
        },
        clear=False,
    ):
        with pytest.raises(RuntimeError, match="Google Veo env vars not configured"):
            await generate_ad_video_google_veo(
                script="Script",
                product_image_bytes=b"img",
                product_image_type="image/png",
                product_image_filename="x.png",
            )


@pytest.mark.asyncio
async def test_generate_ad_video_google_veo_raises_when_vertex_mode():
    with patch.dict(
        "os.environ",
        {
            "GOOGLE_API_KEY": "real-key",
            "GOOGLE_GENAI_USE_VERTEXAI": "true",
        },
        clear=False,
    ):
        with pytest.raises(RuntimeError, match="Gemini Developer API"):
            await generate_ad_video_google_veo(
                script="Script",
                product_image_bytes=b"img",
                product_image_type="image/png",
                product_image_filename="x.png",
            )


@pytest.mark.asyncio
async def test_generate_ad_video_google_veo_returns_bytes_from_file_download():
    fake_video_bytes = b"fake veo mp4"
    video_obj = MagicMock()
    video_obj.video_bytes = None
    gen_item = MagicMock()
    gen_item.video = video_obj
    result = MagicMock()
    result.generated_videos = [gen_item]

    op_pending = MagicMock()
    op_pending.done = False
    op_done = MagicMock()
    op_done.done = True
    op_done.error = None
    op_done.result = result

    mock_client = MagicMock()
    mock_client.aio.models.generate_videos = AsyncMock(return_value=op_pending)
    mock_client.aio.operations.get = AsyncMock(return_value=op_done)
    mock_client.aio.files.download = AsyncMock(return_value=fake_video_bytes)

    with (
        patch("workers.ad_video_generation_worker.worker.genai.Client", return_value=mock_client),
        patch.dict(
            "os.environ",
            {
                "GOOGLE_API_KEY": "g-key",
                "GOOGLE_GENAI_USE_VERTEXAI": "",
                "VIDEO_SECONDS": "8",
            },
            clear=False,
        ),
    ):
        out = await generate_ad_video_google_veo(
            script="Body",
            product_image_bytes=b"\xff\xd8",
            product_image_type="image/jpeg",
            product_image_filename="p.jpg",
        )

        assert out == fake_video_bytes
        mock_client.aio.models.generate_videos.assert_awaited_once()
        call_kw = mock_client.aio.models.generate_videos.await_args[1]
        assert call_kw["model"] == DEFAULT_VEO_MODEL
        assert call_kw["prompt"] == video_prompt_audio_prefix(allowed_video_seconds()) + "Body"
        cfg = call_kw["config"]
        assert len(cfg.reference_images) == 1
        ref = cfg.reference_images[0]
        assert ref.image.image_bytes == b"\xff\xd8"
        assert ref.image.mime_type == "image/jpeg"
        assert cfg.aspect_ratio == "9:16"
        assert cfg.resolution == "720p"
        assert cfg.duration_seconds == 8
        assert cfg.person_generation == "allow_all"
        mock_client.aio.files.download.assert_awaited_once_with(file=video_obj)


@pytest.mark.asyncio
async def test_generate_ad_video_google_veo_accepts_gemini_api_key_env():
    video_obj = MagicMock()
    video_obj.video_bytes = b"x"
    gen_item = MagicMock()
    gen_item.video = video_obj
    result = MagicMock()
    result.generated_videos = [gen_item]
    op_done = MagicMock()
    op_done.done = True
    op_done.error = None
    op_done.result = result

    mock_client = MagicMock()
    mock_client.aio.models.generate_videos = AsyncMock(return_value=op_done)
    mock_client.aio.operations.get = AsyncMock()

    with (
        patch("workers.ad_video_generation_worker.worker.genai.Client") as mock_client_cls,
        patch.dict(
            "os.environ",
            {
                "GEMINI_API_KEY": "gemini-key",
                "GOOGLE_API_KEY": "",
                "GOOGLE_VEO_API_KEY": "",
                "VIDEO_SECONDS": "8",
            },
            clear=False,
        ),
    ):
        mock_client_cls.return_value = mock_client
        out = await generate_ad_video_google_veo(
            script="S",
            product_image_bytes=b"i",
            product_image_type="image/png",
            product_image_filename="x.png",
        )

    assert out == b"x"
    mock_client_cls.assert_called_once_with(api_key="gemini-key")


@pytest.mark.asyncio
async def test_generate_ad_video_google_veo_returns_inline_video_bytes():
    video_obj = MagicMock()
    video_obj.video_bytes = b"inline"
    gen_item = MagicMock()
    gen_item.video = video_obj
    result = MagicMock()
    result.generated_videos = [gen_item]

    op_done = MagicMock()
    op_done.done = True
    op_done.error = None
    op_done.result = result

    mock_client = MagicMock()
    mock_client.aio.models.generate_videos = AsyncMock(return_value=op_done)
    mock_client.aio.operations.get = AsyncMock()

    with (
        patch("workers.ad_video_generation_worker.worker.genai.Client", return_value=mock_client),
        patch.dict(
            "os.environ",
            {"GOOGLE_API_KEY": "g-key", "VIDEO_SECONDS": "8"},
            clear=False,
        ),
    ):
        out = await generate_ad_video_google_veo(
            script="S",
            product_image_bytes=b"i",
            product_image_type="image/png",
            product_image_filename="x.png",
        )

    assert out == b"inline"
    mock_client.aio.files.download.assert_not_called()


@pytest.mark.asyncio
async def test_generate_ad_video_google_veo_raises_when_poll_timeout():
    op_pending = MagicMock()
    op_pending.done = False

    mock_client = MagicMock()
    mock_client.aio.models.generate_videos = AsyncMock(return_value=op_pending)
    mock_client.aio.operations.get = AsyncMock(return_value=op_pending)

    with (
        patch("workers.ad_video_generation_worker.worker.genai.Client", return_value=mock_client),
        patch("workers.ad_video_generation_worker.worker.MAX_POLL_ATTEMPTS", 2),
        patch("workers.ad_video_generation_worker.worker.POLL_INTERVAL_SECONDS", 0),
        patch.dict(
            "os.environ",
            {"GOOGLE_API_KEY": "g-key", "VIDEO_SECONDS": "8"},
            clear=False,
        ),
    ):
        with pytest.raises(RuntimeError, match="did not complete within"):
            await generate_ad_video_google_veo(
                script="Script",
                product_image_bytes=b"img",
                product_image_type="image/png",
                product_image_filename="x.png",
            )
