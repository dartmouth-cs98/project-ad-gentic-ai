"""Choose Sora (OpenAI) vs Veo (Google) from an ad script's creative profile."""

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

CONFIDENCE_THRESHOLD = 0.70

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

_AMBIENT_LINE = re.compile(
    r"none\s*[—–-]\s*ambient|ambient\s+only|no\s+spoken|no\s+dialogue",
    re.IGNORECASE,
)
_LINE_FIELD = re.compile(
    r"-\s*Line\s*(?:\([^)]*\))?\s*:\s*(.+?)(?=\n-\s|\n##|\Z)",
    re.IGNORECASE | re.DOTALL,
)
_CAMERA_MOVE_FIELD = re.compile(
    r"-\s*Camera move\s*:\s*(.+?)(?=\n-\s|\n##|\Z)",
    re.IGNORECASE | re.DOTALL,
)

_DIALOGUE_FORMAT_CUES = (
    "storytime",
    "talking to camera",
    "to-camera",
    "to camera",
    "monologue",
    "interview",
    "voiceover with",
    "duet",
    "stitch energy",
    "pov reaction",
    "says to camera",
    "speaks to camera",
    "direct address",
)

_CINEMATIC_CUES = (
    "whip pan",
    "drone",
    "aerial",
    "crane shot",
    "tracking shot",
    "slow motion",
    "slow-mo",
    "montage",
    "quick cut",
    "timelapse",
    "time-lapse",
    "steadicam",
    "orbit shot",
    "macro push",
    "dolly zoom",
    "crane up",
    "chase sequence",
    "one-take",
    "single take",
)

_COMPLEX_CAMERA_WORDS = (
    "whip",
    "drone",
    "aerial",
    "crane",
    "tracking",
    "orbit",
    "steadicam",
    "dolly",
    "gimbal",
    "macro",
    "zoom",
)


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
        logger.debug("Skipping Grok video provider classifier: SCRIPT_* env not fully configured.")
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
        logger.exception("Grok video provider classifier failed; using heuristic fallback.")
        return None


def _spoken_line_texts(script: str) -> list[str]:
    lines: list[str] = []
    for raw in _LINE_FIELD.findall(script):
        text = " ".join(raw.split()).strip()
        if not text or _AMBIENT_LINE.search(text):
            continue
        if text.startswith("(") and ")" in text:
            after = text[text.index(")") + 1 :].strip()
            if after and not _AMBIENT_LINE.search(after):
                text = after
            elif _AMBIENT_LINE.search(text):
                continue
        lines.append(text)
    return lines


def _estimate_spoken_words(script: str) -> int:
    return sum(len(line.split()) for line in _spoken_line_texts(script))


def _count_complex_camera_moves(script: str) -> int:
    count = 0
    for move in _CAMERA_MOVE_FIELD.findall(script):
        lower = move.lower()
        if any(word in lower for word in _COMPLEX_CAMERA_WORDS):
            count += 1
    return count


def choose_video_provider_heuristic(script: str) -> VideoProvider:
    """Heuristic Sora/Veo routing (legacy scorer). Used when Grok is unavailable or low-confidence."""
    if not script or not script.strip():
        return "sora"

    lower = script.lower()
    spoken = _spoken_line_texts(script)
    spoken_beats = len(spoken)
    spoken_words = _estimate_spoken_words(script)
    complex_cameras = _count_complex_camera_moves(script)

    dialogue_score = 0
    if spoken_words >= 28:
        dialogue_score += 3
    elif spoken_words >= 14:
        dialogue_score += 2
    elif spoken_words >= 6:
        dialogue_score += 1

    if spoken_beats >= 3:
        dialogue_score += 2
    elif spoken_beats >= 2:
        dialogue_score += 1

    dialogue_score += sum(1 for cue in _DIALOGUE_FORMAT_CUES if cue in lower)

    cinematic_score = 0
    cinematic_score += sum(1 for cue in _CINEMATIC_CUES if cue in lower)
    cinematic_score += min(complex_cameras, 3)

    if spoken_beats <= 1 and spoken_words < 8:
        cinematic_score += 2
    if spoken_beats >= 2 and spoken_words >= 10:
        dialogue_score += 1

    if dialogue_score > cinematic_score:
        return "veo"
    if cinematic_score > dialogue_score:
        return "sora"
    if spoken_beats >= 2 or spoken_words >= 12:
        return "veo"
    return "sora"


def _heuristic_decision(script: str, *, note: str = "") -> ProviderDecision:
    provider = choose_video_provider_heuristic(script)
    reason = "Heuristic routing."
    if note:
        reason = f"{reason} {note}".strip()
    return ProviderDecision(
        provider=provider,
        confidence=0.0,
        reason=reason,
        features=_empty_features(),
        fallback_used=True,
    )


def choose_video_provider_with_reason(script: str) -> ProviderDecision:
    """Classify with Grok when possible; fall back to heuristics on low confidence or errors."""
    if not script or not script.strip():
        return ProviderDecision(
            provider="sora",
            confidence=1.0,
            reason="Empty script; defaulting to Sora.",
            features=_empty_features(),
            fallback_used=False,
        )

    grok = _classify_script_with_grok(script)
    if grok is None:
        return _heuristic_decision(script)

    if grok.confidence >= CONFIDENCE_THRESHOLD:
        return ProviderDecision(
            provider=grok.provider,
            confidence=grok.confidence,
            reason=grok.reason,
            features=dict(grok.features),
            fallback_used=False,
        )

    return _heuristic_decision(
        script,
        note=f"(Grok confidence {grok.confidence:.2f} < {CONFIDENCE_THRESHOLD})",
    )


def choose_video_provider(script: str) -> VideoProvider:
    """Return ``veo`` or ``sora`` for the ad video provider."""
    return choose_video_provider_with_reason(script).provider
