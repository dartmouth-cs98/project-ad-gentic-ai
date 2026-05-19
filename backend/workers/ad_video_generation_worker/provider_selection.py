"""Choose Sora (OpenAI) vs Veo (Google) for an entire ad via Grok classifier."""

from __future__ import annotations

import json
import logging
import math
import os
import re
from dataclasses import dataclass
from typing import Literal

from openai import OpenAI

from utils.responses_api_text import extract_responses_api_text
from utils.video_provider_config import veo_generation_enabled

logger = logging.getLogger(__name__)

VideoProvider = Literal["sora", "veo"]

PrimaryFailureMode = Literal[
    "bad_lipsync",
    "uncanny_humans",
    "identity_drift",
    "weak_cinematography",
    "poor_product_demo",
    "low_risk",
]

_PRIMARY_FAILURE_MODES: frozenset[str] = frozenset(
    (
        "bad_lipsync",
        "uncanny_humans",
        "identity_drift",
        "weak_cinematography",
        "poor_product_demo",
        "low_risk",
    )
)

_FEATURE_KEYS = (
    "visible_speaker",
    "voiceover_only",
    "lip_sync_risk",
    "dialogue_heavy",
    "cinematic_montage",
    "stylized_or_surreal",
    "realistic_human_performance",
    "product_or_ui_demo",
    "credibility_sensitive",
    "human_realism_dependency",
    "identity_consistency_required",
    "shot_coherence_required",
    "visual_ambition_high",
)

_CLASSIFIER_INSTRUCTIONS = """You classify short-form video ad scripts to pick ONE video generation backend for the entire spot (not per scene).

Ask: which provider is less likely to produce an unusable ad?

Analyze the full script for visible speakers, dialogue, lip-sync risk, montage structure, stylized visuals, human realism needs, identity consistency across cuts, product/UI demo accuracy, credibility, voiceover-only structure, and visual ambition.

Prefer **veo** when:
- visible speaking humans, testimonials, interviews, founder/customer content
- realistic human performance is essential
- identity consistency matters across cuts
- product/UI demo accuracy matters
- credibility-sensitive content
- main failure risk is bad lip sync, uncanny humans, identity drift, or poor product demo

Prefer **sora** when:
- voiceover-only, cinematic montage, stylized/surreal/abstract visuals
- aesthetic product glamour shots, fast-cut or motion-heavy visuals
- shot-to-shot inconsistency is acceptable
- main failure risk is weak cinematography

Respond with ONLY a single JSON object (no markdown fences, no other text) matching this schema exactly:
{
  "provider": "sora" | "veo",
  "confidence": <number from 0.0 to 1.0>,
  "reason": "<short explanation>",
  "primary_failure_mode": "bad_lipsync" | "uncanny_humans" | "identity_drift" | "weak_cinematography" | "poor_product_demo" | "low_risk",
  "features": {
    "visible_speaker": <boolean>,
    "voiceover_only": <boolean>,
    "lip_sync_risk": <boolean>,
    "dialogue_heavy": <boolean>,
    "cinematic_montage": <boolean>,
    "stylized_or_surreal": <boolean>,
    "realistic_human_performance": <boolean>,
    "product_or_ui_demo": <boolean>,
    "credibility_sensitive": <boolean>,
    "human_realism_dependency": <boolean>,
    "identity_consistency_required": <boolean>,
    "shot_coherence_required": <boolean>,
    "visual_ambition_high": <boolean>
  }
}"""


class VideoProviderClassificationError(Exception):
    """Grok classifier returned missing, empty, or invalid JSON."""


@dataclass(frozen=True)
class ProviderDecision:
    provider: VideoProvider
    confidence: float
    reason: str
    primary_failure_mode: str
    features: dict[str, bool]
    fallback_used: bool


@dataclass(frozen=True)
class _GrokClassification:
    provider: VideoProvider
    confidence: float
    reason: str
    primary_failure_mode: str
    features: dict[str, bool]


def _empty_features() -> dict[str, bool]:
    return {key: False for key in _FEATURE_KEYS}


def _grok_client_and_model() -> tuple[OpenAI, str]:
    api_key = os.getenv("SCRIPT_API_KEY", "").strip()
    model = os.getenv("SCRIPT_MODEL", "").strip()
    base_url = os.getenv("SCRIPT_BASE_URL", "").strip()
    if not api_key or not base_url or not model:
        raise VideoProviderClassificationError(
            "Grok video provider classifier not configured "
            "(SCRIPT_API_KEY, SCRIPT_BASE_URL, and SCRIPT_MODEL are required)."
        )
    return OpenAI(api_key=api_key, base_url=base_url), model


def _coerce_bool(value: object) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return bool(value)
    if isinstance(value, str):
        normalized = value.strip().lower()
        if normalized in ("true", "1", "yes"):
            return True
        if normalized in ("false", "0", "no"):
            return False
    raise ValueError(f"expected boolean, got {type(value).__name__}: {value!r}")


def _normalize_features(raw: object) -> dict[str, bool]:
    if not isinstance(raw, dict):
        raise ValueError(f'"features" must be a JSON object, got {type(raw).__name__}')
    features = _empty_features()
    for key in _FEATURE_KEYS:
        if key in raw:
            features[key] = _coerce_bool(raw[key])
    return features


def _normalize_primary_failure_mode(raw: object) -> str:
    if not isinstance(raw, str) or not raw.strip():
        raise ValueError('"primary_failure_mode" must be a non-empty string')
    mode = raw.strip()
    if mode not in _PRIMARY_FAILURE_MODES:
        raise ValueError(
            f'invalid primary_failure_mode {mode!r}; '
            f"expected one of {sorted(_PRIMARY_FAILURE_MODES)}"
        )
    return mode


def _extract_json_object(raw: str) -> str:
    """Strip markdown fences and isolate the first JSON object when Grok adds prose."""
    text = raw.strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if fence:
        text = fence.group(1).strip()

    start = text.find("{")
    if start < 0:
        return text

    decoder = json.JSONDecoder()
    try:
        _, end = decoder.raw_decode(text, idx=start)
        return text[start:end]
    except json.JSONDecodeError:
        end = text.rfind("}")
        if end > start:
            return text[start : end + 1]
        return text


def parse_classifier_json(text: str) -> _GrokClassification:
    """Parse and validate strict JSON from the Grok classifier."""
    raw = _extract_json_object(text)
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise VideoProviderClassificationError(f"classifier response is not valid JSON: {exc}") from exc

    if not isinstance(data, dict):
        raise VideoProviderClassificationError(
            f"classifier response must be a JSON object, got {type(data).__name__}"
        )

    provider_raw = data.get("provider")
    if isinstance(provider_raw, str):
        provider_raw = provider_raw.strip().lower()
    if provider_raw not in ("sora", "veo"):
        raise VideoProviderClassificationError(
            f'invalid provider {data.get("provider")!r}; expected "sora" or "veo"'
        )

    confidence_raw = data.get("confidence")
    if not isinstance(confidence_raw, (int, float)):
        raise VideoProviderClassificationError(
            f'"confidence" must be a number, got {type(confidence_raw).__name__}'
        )
    confidence = float(confidence_raw)
    if math.isnan(confidence):
        confidence = 0.0
    elif confidence < 0.0:
        confidence = 0.0
    elif confidence > 1.0:
        confidence = 1.0

    reason = data.get("reason")
    if not isinstance(reason, str) or not reason.strip():
        raise VideoProviderClassificationError('"reason" must be a non-empty string')

    try:
        primary_failure_mode = _normalize_primary_failure_mode(data.get("primary_failure_mode"))
        features = _normalize_features(data.get("features"))
    except ValueError as exc:
        raise VideoProviderClassificationError(str(exc)) from exc

    return _GrokClassification(
        provider=provider_raw,
        confidence=confidence,
        reason=reason.strip(),
        primary_failure_mode=primary_failure_mode,
        features=features,
    )


def _classify_script_with_grok(script: str) -> _GrokClassification:
    """Call Grok (SCRIPT_* API) and return a validated classification."""
    client, model = _grok_client_and_model()
    user_content = f"Ad script to classify:\n\n{script}"

    try:
        response = client.responses.create(
            model=model,
            instructions=_CLASSIFIER_INSTRUCTIONS,
            input=[{"role": "user", "content": [{"type": "input_text", "text": user_content}]}],
            max_output_tokens=700,
        )
    except Exception as exc:
        raise VideoProviderClassificationError(
            f"Grok video provider classifier API call failed: {exc}"
        ) from exc

    text = extract_responses_api_text(response)
    if not text:
        raise VideoProviderClassificationError(
            "Grok video provider classifier returned no extractable text."
        )

    result = parse_classifier_json(text)
    logger.info(
        "Grok video provider classification: provider=%s confidence=%.2f "
        "primary_failure_mode=%s reason=%r features=%s",
        result.provider,
        result.confidence,
        result.primary_failure_mode,
        result.reason,
        result.features,
    )
    return result


def _decision_from_grok(grok: _GrokClassification) -> ProviderDecision:
    return ProviderDecision(
        provider=grok.provider,
        confidence=grok.confidence,
        reason=grok.reason,
        primary_failure_mode=grok.primary_failure_mode,
        features=dict(grok.features),
        fallback_used=False,
    )


def _classifier_failure_decision(reason: str) -> ProviderDecision:
    return ProviderDecision(
        provider="sora",
        confidence=0.0,
        reason=reason,
        primary_failure_mode="low_risk",
        features=_empty_features(),
        fallback_used=True,
    )


def choose_video_provider_with_reason(script: str) -> ProviderDecision:
    """Classify the full script with Grok; Sora preferred when classification fails."""
    if not veo_generation_enabled():
        return ProviderDecision(
            provider="sora",
            confidence=1.0,
            reason="Veo generation disabled (VEO_GENERATION_ENABLED); using Sora.",
            primary_failure_mode="low_risk",
            features=_empty_features(),
            fallback_used=False,
        )

    if not script or not script.strip():
        return ProviderDecision(
            provider="sora",
            confidence=1.0,
            reason="Empty script; defaulting to Sora.",
            primary_failure_mode="low_risk",
            features=_empty_features(),
            fallback_used=False,
        )

    try:
        return _decision_from_grok(_classify_script_with_grok(script))
    except VideoProviderClassificationError as exc:
        logger.warning("Video provider classification failed: %s", exc)
        return _classifier_failure_decision(
            f"Grok classifier failed ({exc}); defaulting to Sora."
        )


def choose_video_provider(script: str) -> VideoProvider:
    """Return ``veo`` or ``sora`` for the entire ad video."""
    return choose_video_provider_with_reason(script).provider
