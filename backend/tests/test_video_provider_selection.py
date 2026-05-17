"""Unit tests for Sora vs Veo provider selection (Grok classifier)."""

import json
import sys
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

from workers.ad_video_generation_worker.provider_selection import (
    ProviderDecision,
    _GrokClassification,
    choose_video_provider,
    choose_video_provider_with_reason,
)

_DIALOGUE_SCRIPT = """
## Overview
Storytime to camera — relatable morning routine with direct address.

## Beat 1 — 0–2s (hook)
- Line (approx. word count): I used to hate mornings until this changed everything.

## Beat 2 — 2–5s (setup)
- Line (approx. word count): Now I actually look forward to the first sip.
"""

_CINEMATIC_SCRIPT = """
## Overview
Silent visual montage with kinetic camera work — no talking head.

## Beat 1 — 0–2s (hook)
- Camera move: drone aerial descending into alley, whip pan into window
- Line (approx. word count): none — ambient only
"""

_VOICEOVER_MONTAGE_SCRIPT = """
## Overview
Voiceover-led cinematic montage — no on-camera speaker, fast-cut product glamour.

## Beat 1
- Camera move: whip pan, drone aerial
- Line (approx. word count): none — ambient only
"""

_TESTIMONIAL_SCRIPT = """
## Overview
Customer testimonial — talking head, direct address, credibility-sensitive.

## Beat 1
- Line (approx. word count): I was skeptical until I tried it for two weeks straight.
"""

_FOUNDER_SCRIPT = """
## Overview
Founder interview — long continuous dialogue to camera.

## Beat 1
- Line (approx. word count): When we started this company we wanted to fix a real problem.
"""

_APP_DEMO_SCRIPT = """
## Overview
SaaS product demo — screen recording of dashboard UI.

## Beat 1
- Line (approx. word count): See every metric in one place.
"""

_SURREAL_SCRIPT = """
## Overview
Surreal abstract brand film — stylized visuals, no visible speaker.

## Beat 1
- Line (approx. word count): none — ambient only
"""


def _grok_classification(
    *,
    provider: str,
    confidence: float,
    reason: str,
    features: dict[str, bool] | None = None,
) -> _GrokClassification:
    base_features = _empty_features_dict()
    if features:
        base_features.update(features)
    return _GrokClassification(
        provider=provider,  # type: ignore[arg-type]
        confidence=confidence,
        reason=reason,
        features=base_features,
    )


def _empty_features_dict() -> dict[str, bool]:
    return {
        "visible_speaker": False,
        "voiceover_only": False,
        "lip_sync_risk": False,
        "dialogue_heavy": False,
        "cinematic_montage": False,
        "stylized_or_surreal": False,
        "realistic_human_performance": False,
        "product_or_ui_demo": False,
        "credibility_sensitive": False,
    }


def _mock_grok_json(payload: dict):
    return patch(
        "workers.ad_video_generation_worker.provider_selection._classify_script_with_grok",
        return_value=_grok_classification(
            provider=payload["provider"],
            confidence=payload["confidence"],
            reason=payload["reason"],
            features=payload.get("features"),
        ),
    )


@patch(
    "workers.ad_video_generation_worker.provider_selection._classify_script_with_grok",
    return_value=None,
)
def test_choose_video_provider_defaults_sora_when_grok_unavailable(mock_grok):
    decision = choose_video_provider_with_reason(_DIALOGUE_SCRIPT)

    assert decision.provider == "sora"
    assert decision.fallback_used is True
    assert choose_video_provider(_DIALOGUE_SCRIPT) == "sora"
    assert mock_grok.call_count == 2


def test_grok_voiceover_montage_prefers_sora():
    features = {
        "voiceover_only": True,
        "cinematic_montage": True,
        "visible_speaker": False,
    }
    with _mock_grok_json(
        {
            "provider": "sora",
            "confidence": 0.92,
            "reason": "Voiceover montage without visible speaker.",
            "features": features,
        }
    ):
        decision = choose_video_provider_with_reason(_VOICEOVER_MONTAGE_SCRIPT)

    assert decision.provider == "sora"
    assert decision.confidence == 0.92
    assert not decision.fallback_used


def test_grok_testimonial_prefers_veo():
    with _mock_grok_json(
        {
            "provider": "veo",
            "confidence": 0.88,
            "reason": "Talking-head testimonial with spoken lines.",
            "features": {"visible_speaker": True, "dialogue_heavy": True},
        }
    ):
        decision = choose_video_provider_with_reason(_TESTIMONIAL_SCRIPT)

    assert decision.provider == "veo"
    assert not decision.fallback_used


def test_grok_founder_speaking_prefers_veo():
    with _mock_grok_json(
        {
            "provider": "veo",
            "confidence": 0.91,
            "reason": "Founder speaks continuously to camera.",
            "features": {"visible_speaker": True, "dialogue_heavy": True},
        }
    ):
        decision = choose_video_provider_with_reason(_FOUNDER_SCRIPT)

    assert decision.provider == "veo"


def test_grok_cinematic_product_montage_prefers_sora():
    with _mock_grok_json(
        {
            "provider": "sora",
            "confidence": 0.85,
            "reason": "Fast-cut product glamour montage.",
            "features": {"cinematic_montage": True, "voiceover_only": True},
        }
    ):
        decision = choose_video_provider_with_reason(_CINEMATIC_SCRIPT)

    assert decision.provider == "sora"


def test_grok_app_dashboard_demo_prefers_veo():
    with _mock_grok_json(
        {
            "provider": "veo",
            "confidence": 0.82,
            "reason": "Product UI demo with credibility-sensitive claims.",
            "features": {"product_or_ui_demo": True, "credibility_sensitive": True},
        }
    ):
        decision = choose_video_provider_with_reason(_APP_DEMO_SCRIPT)

    assert decision.provider == "veo"
    assert decision.features["product_or_ui_demo"] is True


def test_grok_surreal_abstract_prefers_sora():
    with _mock_grok_json(
        {
            "provider": "sora",
            "confidence": 0.9,
            "reason": "Stylized surreal visuals without speakers.",
            "features": {"stylized_or_surreal": True},
        }
    ):
        decision = choose_video_provider_with_reason(_SURREAL_SCRIPT)

    assert decision.provider == "sora"


def test_grok_low_confidence_still_used():
    with _mock_grok_json(
        {
            "provider": "veo",
            "confidence": 0.55,
            "reason": "Uncertain but leaning dialogue.",
            "features": {"dialogue_heavy": True},
        }
    ):
        decision = choose_video_provider_with_reason(_DIALOGUE_SCRIPT)

    assert decision.provider == "veo"
    assert decision.confidence == 0.55
    assert not decision.fallback_used


def test_malformed_grok_response_defaults_to_sora():
    from workers.ad_video_generation_worker import provider_selection as mod

    mock_response = SimpleNamespace(output_text="{not valid json", output=[])
    mock_client = MagicMock()
    mock_client.responses.create.return_value = mock_response

    with (
        patch.object(mod, "_grok_client_and_model", return_value=(mock_client, "grok-4")),
        patch.dict(
            "os.environ",
            {
                "SCRIPT_API_KEY": "k",
                "SCRIPT_MODEL": "grok-4",
                "SCRIPT_BASE_URL": "https://api.test",
            },
        ),
    ):
        decision = choose_video_provider_with_reason(_DIALOGUE_SCRIPT)

    assert decision.fallback_used is True
    assert decision.provider == "sora"
    assert decision.confidence == 0.0


def test_choose_video_provider_empty_script_without_grok():
    decision = choose_video_provider_with_reason("")
    assert decision.provider == "sora"
    assert not decision.fallback_used


def test_classify_script_with_grok_parses_strict_json():
    from workers.ad_video_generation_worker import provider_selection as mod

    payload = {
        "provider": "veo",
        "confidence": 0.8,
        "reason": "Talking head.",
        "features": {"visible_speaker": True, "dialogue_heavy": True},
    }
    mock_response = SimpleNamespace(output_text=json.dumps(payload), output=[])

    mock_client = MagicMock()
    mock_client.responses.create.return_value = mock_response

    with (
        patch.object(mod, "_grok_client_and_model", return_value=(mock_client, "grok-4")),
        patch.dict(
            "os.environ",
            {
                "SCRIPT_API_KEY": "k",
                "SCRIPT_MODEL": "grok-4",
                "SCRIPT_BASE_URL": "https://api.test",
            },
        ),
    ):
        result = mod._classify_script_with_grok(_TESTIMONIAL_SCRIPT)

    assert result is not None
    assert result.provider == "veo"
    assert result.confidence == 0.8


def test_classify_script_with_grok_returns_none_on_invalid_json():
    from workers.ad_video_generation_worker import provider_selection as mod

    mock_response = SimpleNamespace(output_text="not json at all", output=[])
    mock_client = MagicMock()
    mock_client.responses.create.return_value = mock_response

    with patch.object(mod, "_grok_client_and_model", return_value=(mock_client, "grok-4")):
        assert mod._classify_script_with_grok(_TESTIMONIAL_SCRIPT) is None
