"""Choose Sora (OpenAI) vs Veo (Google) from an ad script via Grok classifier."""

from __future__ import annotations

import json
import logging
import os
import re
from dataclasses import dataclass
from typing import Literal

from openai import OpenAI

from utils.responses_api_text import extract_responses_api_text

logger = logging.getLogger(__name__)

VideoProvider = Literal["sora", "veo"]

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
)

_CLASSIFIER_INSTRUCTIONS = """You classify short-form video ad scripts to pick ONE video generation backend for the entire spot.

Analyze the full script for:
- visible on-camera speaking
- talking head / testimonial energy
- lip sync risk
- cinematic montage structure
- stylized or surreal visuals
- realism requirements
- product or UI demo requirements
- credibility-sensitive content
- voiceover-only structure
- long continuous dialogue
- fast-cut montage pacing

Prefer **veo** for:
- visible speaking characters, talking-head content, testimonials
- founder/customer interviews
- realistic office/home/product-demo scenes
- credibility-sensitive ads, lip-sync-heavy content, long continuous speaking shots

Prefer **sora** for:
- cinematic montage ads, stylized or surreal visuals, abstract visuals
- heavy motion/camera movement, fast-cut edits
- voiceover-led spots without visible speakers
- aesthetic/product glamour shots

Respond with ONLY a single JSON object (no markdown fences, no other text) matching this schema exactly:
{
  "provider": "sora" | "veo",
  "confidence": <number from 0.0 to 1.0>,
  "reason": "<short explanation>",
  "features": {
    "visible_speaker": <boolean>,
    "voiceover_only": <boolean>,
    "lip_sync_risk": <boolean>,
    "dialogue_heavy": <boolean>,
    "cinematic_montage": <boolean>,
    "stylized_or_surreal": <boolean>,
    "realistic_human_performance": <boolean>,
    "product_or_ui_demo": <boolean>,
    "credibility_sensitive": <boolean>
  }
}"""


@dataclass(frozen=True)
class ProviderDecision:
    provider: VideoProvider
    confidence: float
    reason: str
    features: dict[str, bool]
    fallback_used: bool


@dataclass(frozen=True)
class _GrokClassification:
    provider: VideoProvider
    confidence: float
    reason: str
    features: dict[str, bool]


def _empty_features() -> dict[str, bool]:
    return {key: False for key in _FEATURE_KEYS}


def _grok_client_and_model() -> tuple[OpenAI, str] | None:
    api_key = os.getenv("SCRIPT_API_KEY", "").strip()
    model = os.getenv("SCRIPT_MODEL", "").strip()
    base_url = os.getenv("SCRIPT_BASE_URL", "").strip()
    if not api_key or not base_url or not model:
        return None
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


def _parse_classifier_json(text: str) -> _GrokClassification:
    raw = text.strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", raw)
    if fence:
        raw = fence.group(1).strip()
    data = json.loads(raw)
    if not isinstance(data, dict):
        raise ValueError(f"classifier response must be a JSON object, got {type(data).__name__}")

    provider_raw = data.get("provider")
    if provider_raw not in ("sora", "veo"):
        raise ValueError(f'invalid provider {provider_raw!r}; expected "sora" or "veo"')

    confidence_raw = data.get("confidence")
    if not isinstance(confidence_raw, (int, float)):
        raise ValueError(f'"confidence" must be a number, got {type(confidence_raw).__name__}')
    confidence = float(confidence_raw)
    if confidence < 0.0:
        confidence = 0.0
    elif confidence > 1.0:
        confidence = 1.0

    reason = data.get("reason")
    if not isinstance(reason, str) or not reason.strip():
        raise ValueError('"reason" must be a non-empty string')
    features = _normalize_features(data.get("features"))

    return _GrokClassification(
        provider=provider_raw,
        confidence=confidence,
        reason=reason.strip(),
        features=features,
    )


def _classify_script_with_grok(script: str) -> _GrokClassification | None:
    """Call Grok (OpenAI-compatible SCRIPT_* API). Returns None on misconfiguration or failure."""
    client_model = _grok_client_and_model()
    if client_model is None:
        logger.warning(
            "Grok video provider classifier skipped: SCRIPT_API_KEY, SCRIPT_BASE_URL, "
            "and SCRIPT_MODEL must be set."
        )
        return None

    client, model = client_model
    user_content = f"Ad script to classify:\n\n{script}"

    try:
        response = client.responses.create(
            model=model,
            instructions=_CLASSIFIER_INSTRUCTIONS,
            input=[{"role": "user", "content": [{"type": "input_text", "text": user_content}]}],
            max_output_tokens=600,
        )
        text = extract_responses_api_text(response)
        if not text:
            logger.warning("Grok video provider classifier returned no extractable text.")
            return None
        result = _parse_classifier_json(text)
        logger.info(
            "Grok video provider classification: provider=%s confidence=%.2f reason=%r features=%s",
            result.provider,
            result.confidence,
            result.reason,
            result.features,
        )
        return result
    except Exception:
        logger.exception("Grok video provider classifier failed.")
        return None


def _default_sora_decision(*, reason: str, fallback_used: bool) -> ProviderDecision:
    return ProviderDecision(
        provider="sora",
        confidence=0.0,
        reason=reason,
        features=_empty_features(),
        fallback_used=fallback_used,
    )


def _decision_from_grok(grok: _GrokClassification) -> ProviderDecision:
    return ProviderDecision(
        provider=grok.provider,
        confidence=grok.confidence,
        reason=grok.reason,
        features=dict(grok.features),
        fallback_used=False,
    )


def choose_video_provider_with_reason(script: str) -> ProviderDecision:
    """Classify with Grok; default to Sora when the classifier cannot run."""
    if not script or not script.strip():
        return _default_sora_decision(
            reason="Empty script; defaulting to Sora.",
            fallback_used=False,
        )

    grok = _classify_script_with_grok(script)
    if grok is None:
        return _default_sora_decision(
            reason="Grok classifier unavailable or failed; defaulting to Sora.",
            fallback_used=True,
        )

    return _decision_from_grok(grok)


def choose_video_provider(script: str) -> VideoProvider:
    """Return ``veo`` or ``sora`` for the ad video provider."""
    return choose_video_provider_with_reason(script).provider
