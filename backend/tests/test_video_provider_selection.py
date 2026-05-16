"""Unit tests for Sora vs Veo provider selection (Grok classifier + heuristic fallback)."""

import json
import sys
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

from workers.ad_video_generation_worker.provider_selection import (
    CONFIDENCE_THRESHOLD,
    ProviderDecision,
    _GrokClassification,
    choose_video_provider,
    choose_video_provider_heuristic,
    choose_video_provider_with_reason,
)

_DIALOGUE_SCRIPT = """
## Overview
Storytime to camera — relatable morning routine with direct address.

## Beat 1 — 0–2s (hook)
- What we see: creator in kitchen
- Camera move: handheld close-up
- Lighting: morning window
- Action: reacts to alarm
- Line (approx. word count): I used to hate mornings until this changed everything.

## Beat 2 — 2–5s (setup)
- What we see: same creator
- Camera move: slow push-in
- Lighting: warm
- Action: pours drink
- Line (approx. word count): Now I actually look forward to the first sip.

## Beat 3 — 5–9s (payoff)
- What we see: product on counter
- Camera move: medium shot
- Lighting: soft
- Action: smiles at camera
- Line (approx. word count): It's not magic, it's just really good coffee.

## Beat 4 — 9–12s (product moment)
- What we see: pack shot
- Camera move: static hero
- Lighting: clean
- Action: holds bag
- Line (approx. word count): none — ambient only
"""

_CINEMATIC_SCRIPT = """
## Overview
Silent visual montage with kinetic camera work — no talking head.

## Beat 1 — 0–2s (hook)
- What we see: city skyline at dawn
- Camera move: drone aerial descending into alley, whip pan into window
- Lighting: blue hour
- Action: light flicks on
- Line (approx. word count): none — ambient only

## Beat 2 — 2–5s (setup)
- What we see: product on marble
- Camera move: macro push with slow motion pour
- Lighting: rim light
- Action: liquid swirl
- Line (approx. word count): none — ambient only

## Beat 3 — 5–9s (payoff)
- What we see: hands only
- Camera move: steadicam orbit around bottle
- Lighting: high contrast
- Action: cap twists
- Line (approx. word count): none — ambient only

## Beat 4 — 9–12s (product moment)
- What we see: hero pack
- Camera move: crane up reveal
- Lighting: sparkle
- Action: mist in backlight
- Line (approx. word count): none — ambient only
"""

_VOICEOVER_MONTAGE_SCRIPT = """
## Overview
Voiceover-led cinematic montage — no on-camera speaker, fast-cut product glamour.

## Beat 1
- What we see: abstract light trails
- Camera move: whip pan, drone aerial
- Line (approx. word count): none — ambient only

## Beat 2
- What we see: product hero on marble
- Camera move: macro push, quick cut to pour
- Line (approx. word count): none — ambient only
"""

_TESTIMONIAL_SCRIPT = """
## Overview
Customer testimonial — talking head, direct address, credibility-sensitive.

## Beat 1
- What we see: customer speaks to camera in living room
- Camera move: handheld close-up
- Line (approx. word count): I was skeptical until I tried it for two weeks straight.

## Beat 2
- What we see: same customer holds product
- Line (approx. word count): Now I recommend it to everyone on my team.
"""

_FOUNDER_SCRIPT = """
## Overview
Founder interview — long continuous dialogue to camera.

## Beat 1
- What we see: founder at desk
- Camera move: static talking head
- Line (approx. word count): When we started this company we wanted to fix a real problem people feel every day.

## Beat 2
- What we see: founder gestures to product
- Line (approx. word count): This is why we built the simplest workflow you will actually use.
"""

_APP_DEMO_SCRIPT = """
## Overview
SaaS product demo — screen recording of dashboard UI, credibility-sensitive claims.

## Beat 1
- What we see: laptop showing analytics dashboard UI
- Camera move: screen capture push-in
- Line (approx. word count): See every metric in one place.

## Beat 2
- What we see: cursor clicks through product UI
- Line (approx. word count): Teams trust our platform for compliance reporting.
"""

_SURREAL_SCRIPT = """
## Overview
Surreal abstract brand film — stylized visuals, no visible speaker.

## Beat 1
- What we see: melting clocks in neon void
- Camera move: impossible dolly through liquid geometry
- Line (approx. word count): none — ambient only

## Beat 2
- What we see: floating product orb
- Camera move: stylized orbit in dreamscape
- Line (approx. word count): none — ambient only
"""


def _grok_classification(
    *,
    provider: str,
    confidence: float,
    reason: str,
    features: dict[str, bool] | None = None,
) -> _GrokClassification:
    base_features = {
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
    if features:
        base_features.update(features)
    return _GrokClassification(
        provider=provider,  # type: ignore[arg-type]
        confidence=confidence,
        reason=reason,
        features=base_features,
    )


def _mock_grok_json(payload: dict) -> None:
    return patch(
        "workers.ad_video_generation_worker.provider_selection._classify_script_with_grok",
        return_value=_grok_classification(
            provider=payload["provider"],
            confidence=payload["confidence"],
            reason=payload["reason"],
            features=payload.get("features"),
        ),
    )


# ---------------------------------------------------------------------------
# Heuristic-only (no Grok / Grok disabled)
# ---------------------------------------------------------------------------


def test_choose_video_provider_heuristic_prefers_veo_for_dialogue_heavy_script():
    assert choose_video_provider_heuristic(_DIALOGUE_SCRIPT) == "veo"


def test_choose_video_provider_heuristic_prefers_sora_for_cinematic_silent_script():
    assert choose_video_provider_heuristic(_CINEMATIC_SCRIPT) == "sora"


def test_choose_video_provider_heuristic_defaults_sora_for_empty_script():
    assert choose_video_provider_heuristic("") == "sora"
    assert choose_video_provider_heuristic("   ") == "sora"


@patch(
    "workers.ad_video_generation_worker.provider_selection._classify_script_with_grok",
    return_value=None,
)
def test_choose_video_provider_falls_back_to_heuristic_when_grok_unavailable(mock_grok):
    assert choose_video_provider(_DIALOGUE_SCRIPT) == "veo"
    mock_grok.assert_called_once()


# ---------------------------------------------------------------------------
# Grok classifier scenarios (mocked)
# ---------------------------------------------------------------------------


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
    assert decision.features["voiceover_only"] is True
    assert decision.features["cinematic_montage"] is True


def test_grok_testimonial_prefers_veo():
    features = {
        "visible_speaker": True,
        "dialogue_heavy": True,
        "credibility_sensitive": True,
        "lip_sync_risk": True,
    }
    with _mock_grok_json(
        {
            "provider": "veo",
            "confidence": 0.88,
            "reason": "Talking-head testimonial with spoken lines.",
            "features": features,
        }
    ):
        decision = choose_video_provider_with_reason(_TESTIMONIAL_SCRIPT)

    assert decision.provider == "veo"
    assert not decision.fallback_used


def test_grok_founder_speaking_prefers_veo():
    features = {
        "visible_speaker": True,
        "dialogue_heavy": True,
        "lip_sync_risk": True,
        "realistic_human_performance": True,
    }
    with _mock_grok_json(
        {
            "provider": "veo",
            "confidence": 0.91,
            "reason": "Founder speaks continuously to camera.",
            "features": features,
        }
    ):
        decision = choose_video_provider_with_reason(_FOUNDER_SCRIPT)

    assert decision.provider == "veo"


def test_grok_cinematic_product_montage_prefers_sora():
    features = {
        "cinematic_montage": True,
        "voiceover_only": True,
        "visible_speaker": False,
    }
    with _mock_grok_json(
        {
            "provider": "sora",
            "confidence": 0.85,
            "reason": "Fast-cut product glamour montage.",
            "features": features,
        }
    ):
        decision = choose_video_provider_with_reason(_CINEMATIC_SCRIPT)

    assert decision.provider == "sora"


def test_grok_app_dashboard_demo_prefers_veo():
    features = {
        "product_or_ui_demo": True,
        "credibility_sensitive": True,
        "visible_speaker": False,
    }
    with _mock_grok_json(
        {
            "provider": "veo",
            "confidence": 0.82,
            "reason": "Product UI demo with credibility-sensitive claims.",
            "features": features,
        }
    ):
        decision = choose_video_provider_with_reason(_APP_DEMO_SCRIPT)

    assert decision.provider == "veo"
    assert decision.features["product_or_ui_demo"] is True


def test_grok_surreal_abstract_prefers_sora():
    features = {
        "stylized_or_surreal": True,
        "visible_speaker": False,
        "cinematic_montage": True,
    }
    with _mock_grok_json(
        {
            "provider": "sora",
            "confidence": 0.9,
            "reason": "Stylized surreal visuals without speakers.",
            "features": features,
        }
    ):
        decision = choose_video_provider_with_reason(_SURREAL_SCRIPT)

    assert decision.provider == "sora"


def test_grok_provider_used_as_returned_without_override():
    with _mock_grok_json(
        {
            "provider": "sora",
            "confidence": 0.95,
            "reason": "Grok pick is used as-is.",
            "features": {"visible_speaker": True, "dialogue_heavy": True},
        }
    ):
        decision = choose_video_provider_with_reason(_TESTIMONIAL_SCRIPT)

    assert decision.provider == "sora"
    assert decision.reason == "Grok pick is used as-is."


def test_malformed_grok_response_uses_heuristic_fallback():
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
    assert decision.provider == "veo"
    assert decision.confidence == 0.0


def test_low_confidence_grok_uses_heuristic_fallback():
    with _mock_grok_json(
        {
            "provider": "sora",
            "confidence": CONFIDENCE_THRESHOLD - 0.05,
            "reason": "Uncertain montage vs dialogue mix.",
            "features": {"cinematic_montage": True},
        }
    ):
        decision = choose_video_provider_with_reason(_DIALOGUE_SCRIPT)

    assert decision.fallback_used is True
    assert decision.provider == choose_video_provider_heuristic(_DIALOGUE_SCRIPT)
    assert str(CONFIDENCE_THRESHOLD) in decision.reason or "0.70" in decision.reason


def test_choose_video_provider_empty_script_without_grok():
    decision = choose_video_provider_with_reason("")
    assert decision.provider == "sora"
    assert not decision.fallback_used


# ---------------------------------------------------------------------------
# Grok API integration (mocked OpenAI client)
# ---------------------------------------------------------------------------


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
    assert result.features["visible_speaker"] is True


def test_classify_script_with_grok_returns_none_on_invalid_json():
    from workers.ad_video_generation_worker import provider_selection as mod

    mock_response = SimpleNamespace(output_text="not json at all", output=[])
    mock_client = MagicMock()
    mock_client.responses.create.return_value = mock_response

    with patch.object(mod, "_grok_client_and_model", return_value=(mock_client, "grok-4")):
        assert mod._classify_script_with_grok(_TESTIMONIAL_SCRIPT) is None
