"""Tests for Veo 8s script alignment before video generation."""

import sys
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

from utils.video_timing import VEO_DURATION_SECONDS
from workers.ad_job_worker.script_video import align_script_with_video_provider


@pytest.mark.asyncio
async def test_align_script_retimes_for_veo_when_video_seconds_is_twelve():
    long_script = "## Beat 1 — 0–2s\n- Line: hello\n"
    retimed_script = "## Beat 1 — 0–1s\n- Line: hi\n"

    with (
        patch(
            "workers.ad_job_worker.script_video.retime_ad_script_for_veo",
            new_callable=AsyncMock,
            return_value=retimed_script,
        ) as mock_retime,
        patch(
            "workers.ad_job_worker.script_video.evaluate_script",
            new_callable=AsyncMock,
        ) as mock_eval,
        patch.dict(
            "os.environ",
            {
                "VIDEO_SECONDS": "12",
                "GEMINI_API_KEY": "g-key",
                "VEO_GENERATION_ENABLED": "true",
            },
            clear=False,
        ),
    ):
        mock_eval.return_value.passed = True

        script, provider, clip_seconds = await align_script_with_video_provider(
            long_script,
            "veo",
            product_name="P",
            product_description="D",
            product_image_data_url="data:image/png;base64,xx",
            consumer_traits_string="traits",
            campaign_brief="brief",
            campaign_name="",
            campaign_goal="",
            campaign_target_audience="",
            campaign_product_context="",
            generation_preferences=None,
        )

    assert script == retimed_script
    assert provider == "veo"
    assert clip_seconds == VEO_DURATION_SECONDS
    mock_retime.assert_awaited_once()


@pytest.mark.asyncio
async def test_align_script_skips_retime_for_sora():
    script = "## Beat 1\n"
    with patch(
        "workers.ad_job_worker.script_video.retime_ad_script_for_veo",
        new_callable=AsyncMock,
    ) as mock_retime:
        out_script, provider, clip_seconds = await align_script_with_video_provider(
            script,
            "sora",
            product_name="P",
            product_description="",
            product_image_data_url="data:image/png;base64,xx",
            consumer_traits_string="t",
            campaign_brief="",
            campaign_name="",
            campaign_goal="",
            campaign_target_audience="",
            campaign_product_context="",
            generation_preferences=None,
        )

    assert out_script == script
    assert provider == "sora"
    assert clip_seconds == 12
    mock_retime.assert_not_called()
