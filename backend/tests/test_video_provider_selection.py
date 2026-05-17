"""Unit tests for Sora vs Veo provider selection (Grok classifier only)."""

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
    VideoProviderClassificationError,
    _GrokClassification,
    choose_video_provider,
    choose_video_provider_with_reason,
    parse_classifier_json,
)

_FOUNDER_TESTIMONIAL_SCRIPT = """
## Overview
Founder testimonial — visible speaker, direct address, credibility-sensitive.

## Beat 1
- What we see: founder speaks to camera in office
- Line (approx. word count): We built this because teams were drowning in spreadsheets.

## Beat 2
- What we see: same founder holds product
- Line (approx. word count): Now customers tell us it changed how they work.
"""

_VOICEOVER_MONTAGE_SCRIPT = """
## Overview
Voiceover-only cinematic montage — no on-camera speaker, fast-cut glamour.

## Beat 1
- Camera move: whip pan, drone aerial
- Line (approx. word count): none — ambient only

## Beat 2
- Camera move: macro push, quick cut
- Line (approx. word count): none — ambient only
"""

_PRODUCT_UI_SCRIPT = """
## Overview
Product UI walkthrough — dashboard demo, credibility-sensitive claims.

## Beat 1
- What we see: laptop showing analytics dashboard UI
- Camera move: screen capture push-in
- Line (approx. word count): See every metric in one place.

## Beat 2
- What we see: cursor clicks through product UI
- Line (approx. word count): Teams trust our platform for compliance reporting.
"""

_SURREAL_GLAMOUR_SCRIPT = """
## Overview
Surreal product glamour — stylized abstract visuals, high visual ambition.

## Beat 1
- What we see: floating product orb in neon void
- Camera move: impossible dolly through liquid geometry
- Line (approx. word count): none — ambient only
"""

_MULTI_SCENE_SAME_ACTOR_SCRIPT = """
## Overview
Same spokesperson across multiple scenes — identity must stay consistent.

## Beat 1
- What we see: same actor in kitchen, speaks to camera
- Line (approx. word count): I start every morning with this routine.

## Beat 2
- What we see: same actor in gym, continues story
- Line (approx. word count): It keeps me consistent all day long.

## Beat 3
- What we see: same actor at desk, closes to camera
- Line (approx. word count): That is why I never skip it.
"""


def _all_features(**overrides: bool) -> dict[str, bool]:
    base = {
        "visible_speaker": False,
        "voiceover_only": False,
        "lip_sync_risk": False,
        "dialogue_heavy": False,
        "cinematic_montage": False,
        "stylized_or_surreal": False,
        "realistic_human_performance": False,
        "product_or_ui_demo": False,
        "credibility_sensitive": False,
        "human_realism_dependency": False,
        "identity_consistency_required": False,
        "shot_coherence_required": False,
        "visual_ambition_high": False,
    }
    base.update(overrides)
    return base


def _grok_classification(
    *,
    provider: str,
    confidence: float,
    reason: str,
    primary_failure_mode: str = "low_risk",
    features: dict[str, bool] | None = None,
) -> _GrokClassification:
    return _GrokClassification(
        provider=provider,  # type: ignore[arg-type]
        confidence=confidence,
        reason=reason,
        primary_failure_mode=primary_failure_mode,
        features=features or _all_features(),
    )


def _mock_grok(return_value: _GrokClassification):
    return patch(
        "workers.ad_video_generation_worker.provider_selection._classify_script_with_grok",
        return_value=return_value,
    )


def _payload(
    *,
    provider: str,
    confidence: float,
    reason: str,
    primary_failure_mode: str = "low_risk",
    features: dict[str, bool] | None = None,
) -> dict:
    return {
        "provider": provider,
        "confidence": confidence,
        "reason": reason,
        "primary_failure_mode": primary_failure_mode,
        "features": features or _all_features(),
    }


def test_choose_video_provider_empty_script():
    decision = choose_video_provider_with_reason("")
    assert decision == ProviderDecision(
        provider="sora",
        confidence=1.0,
        reason="Empty script; defaulting to Sora.",
        primary_failure_mode="low_risk",
        features=_all_features(),
        fallback_used=False,
    )
    assert choose_video_provider("   ") == "sora"


def test_founder_testimonial_visible_speaker_prefers_veo():
    grok = _grok_classification(
        provider="veo",
        confidence=0.91,
        reason="Visible founder testimonial; lip-sync and realism risks favor Veo.",
        primary_failure_mode="bad_lipsync",
        features=_all_features(
            visible_speaker=True,
            dialogue_heavy=True,
            lip_sync_risk=True,
            human_realism_dependency=True,
            credibility_sensitive=True,
        ),
    )
    with _mock_grok(grok):
        decision = choose_video_provider_with_reason(_FOUNDER_TESTIMONIAL_SCRIPT)

    assert decision.provider == "veo"
    assert decision.primary_failure_mode == "bad_lipsync"
    assert not decision.fallback_used


def test_voiceover_cinematic_montage_prefers_sora():
    grok = _grok_classification(
        provider="sora",
        confidence=0.93,
        reason="Voiceover montage; cinematography is the main risk.",
        primary_failure_mode="weak_cinematography",
        features=_all_features(
            voiceover_only=True,
            cinematic_montage=True,
            visual_ambition_high=True,
        ),
    )
    with _mock_grok(grok):
        decision = choose_video_provider_with_reason(_VOICEOVER_MONTAGE_SCRIPT)

    assert decision.provider == "sora"
    assert decision.primary_failure_mode == "weak_cinematography"


def test_product_ui_walkthrough_prefers_veo():
    grok = _grok_classification(
        provider="veo",
        confidence=0.87,
        reason="UI demo accuracy and credibility favor Veo.",
        primary_failure_mode="poor_product_demo",
        features=_all_features(
            product_or_ui_demo=True,
            credibility_sensitive=True,
            shot_coherence_required=True,
        ),
    )
    with _mock_grok(grok):
        decision = choose_video_provider_with_reason(_PRODUCT_UI_SCRIPT)

    assert decision.provider == "veo"
    assert decision.features["product_or_ui_demo"] is True


def test_surreal_product_glamour_prefers_sora():
    grok = _grok_classification(
        provider="sora",
        confidence=0.9,
        reason="Stylized surreal glamour; weak cinematography is acceptable tradeoff.",
        primary_failure_mode="weak_cinematography",
        features=_all_features(
            stylized_or_surreal=True,
            visual_ambition_high=True,
            cinematic_montage=True,
        ),
    )
    with _mock_grok(grok):
        decision = choose_video_provider_with_reason(_SURREAL_GLAMOUR_SCRIPT)

    assert decision.provider == "sora"


def test_same_actor_multiple_scenes_prefers_veo():
    grok = _grok_classification(
        provider="veo",
        confidence=0.89,
        reason="Same actor across scenes; identity consistency required.",
        primary_failure_mode="identity_drift",
        features=_all_features(
            visible_speaker=True,
            dialogue_heavy=True,
            identity_consistency_required=True,
            human_realism_dependency=True,
        ),
    )
    with _mock_grok(grok):
        decision = choose_video_provider_with_reason(_MULTI_SCENE_SAME_ACTOR_SCRIPT)

    assert decision.provider == "veo"
    assert decision.primary_failure_mode == "identity_drift"


def test_low_confidence_grok_result_is_still_accepted():
    grok = _grok_classification(
        provider="veo",
        confidence=0.42,
        reason="Leaning dialogue but uncertain.",
        primary_failure_mode="uncanny_humans",
        features=_all_features(dialogue_heavy=True),
    )
    with _mock_grok(grok):
        decision = choose_video_provider_with_reason(_FOUNDER_TESTIMONIAL_SCRIPT)

    assert decision.provider == "veo"
    assert decision.confidence == 0.42
    assert not decision.fallback_used


def test_invalid_grok_json_defaults_to_sora():
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
        decision = choose_video_provider_with_reason(_FOUNDER_TESTIMONIAL_SCRIPT)

    assert decision.provider == "sora"
    assert decision.confidence == 0.0
    assert decision.fallback_used is True
    assert "Grok classifier failed" in decision.reason
    assert "defaulting to Sora" in decision.reason


def test_parse_classifier_json_accepts_uppercase_provider():
    payload = _payload(provider="veo", confidence=0.9, reason="ok")
    payload["provider"] = "VEO"
    result = parse_classifier_json(json.dumps(payload))
    assert result.provider == "veo"


def test_parse_classifier_json_treats_nan_confidence_as_zero():
    payload = _payload(provider="sora", confidence=0.5, reason="ok")
    raw = json.dumps(payload).replace("0.5", "NaN")
    result = parse_classifier_json(raw)
    assert result.confidence == 0.0


def test_parse_classifier_json_extracts_object_from_preamble():
    payload = _payload(provider="veo", confidence=0.8, reason="talking head")
    text = f"Here is the classification:\n{json.dumps(payload)}"
    result = parse_classifier_json(text)
    assert result.provider == "veo"


def test_parse_classifier_json_rejects_invalid_primary_failure_mode():
    payload = _payload(
        provider="veo",
        confidence=0.8,
        reason="ok",
        primary_failure_mode="unknown_mode",
    )
    with pytest.raises(VideoProviderClassificationError, match="primary_failure_mode"):
        parse_classifier_json(json.dumps(payload))


def test_parse_classifier_json_accepts_full_schema():
    payload = _payload(
        provider="sora",
        confidence=1.1,
        reason="  cinematic montage  ",
        primary_failure_mode="weak_cinematography",
        features=_all_features(cinematic_montage=True, visual_ambition_high=True),
    )
    result = parse_classifier_json(json.dumps(payload))
    assert result.provider == "sora"
    assert result.confidence == 1.0
    assert result.reason == "cinematic montage"
    assert result.primary_failure_mode == "weak_cinematography"
    assert result.features["visual_ambition_high"] is True


def test_classify_script_with_grok_integration():
    from workers.ad_video_generation_worker import provider_selection as mod

    payload = _payload(
        provider="veo",
        confidence=0.8,
        reason="Talking head.",
        primary_failure_mode="bad_lipsync",
        features=_all_features(visible_speaker=True, dialogue_heavy=True),
    )
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
        result = mod._classify_script_with_grok(_FOUNDER_TESTIMONIAL_SCRIPT)

    assert result.provider == "veo"
    assert result.primary_failure_mode == "bad_lipsync"
