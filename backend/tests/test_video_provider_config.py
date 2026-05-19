"""Tests for Sora vs Veo env configuration."""

from unittest.mock import patch

import pytest

from utils.video_provider_config import (
    provider_from_configured_keys,
    veo_configured,
    veo_generation_enabled,
)


def test_veo_generation_enabled_defaults_true(monkeypatch):
    monkeypatch.delenv("VEO_GENERATION_ENABLED", raising=False)
    assert veo_generation_enabled() is True


@pytest.mark.parametrize("value", ("false", "0", "no", "FALSE"))
def test_veo_generation_enabled_false_values(value: str):
    with patch.dict("os.environ", {"VEO_GENERATION_ENABLED": value}, clear=False):
        assert veo_generation_enabled() is False


@pytest.mark.parametrize("value", ("true", "1", "yes"))
def test_veo_generation_enabled_true_values(value: str):
    with patch.dict("os.environ", {"VEO_GENERATION_ENABLED": value}, clear=False):
        assert veo_generation_enabled() is True


def test_veo_configured_false_when_generation_disabled():
    with patch.dict(
        "os.environ",
        {
            "VEO_GENERATION_ENABLED": "false",
            "GEMINI_API_KEY": "real-key",
            "VIDEO_API_KEY": "v-key",
        },
        clear=False,
    ):
        assert veo_configured() is False
        assert provider_from_configured_keys() == "sora"


def test_choose_video_provider_skips_grok_when_veo_disabled():
    from workers.ad_video_generation_worker.provider_selection import (
        choose_video_provider_with_reason,
    )

    with patch.dict("os.environ", {"VEO_GENERATION_ENABLED": "false"}, clear=False):
        decision = choose_video_provider_with_reason(
            "Founder on camera: Hi, I'm the CEO and this product changed my life."
        )

    assert decision.provider == "sora"
    assert "VEO_GENERATION_ENABLED" in decision.reason
    assert decision.fallback_used is False
