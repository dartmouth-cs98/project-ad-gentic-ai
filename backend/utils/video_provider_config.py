"""Env-based checks for Sora vs Veo video generation backends."""

from __future__ import annotations

import os
from typing import Literal

VideoProvider = Literal["sora", "veo"]

_VEO_VERTEX_ENV_MARKERS = ("true", "1", "yes")
_VEO_DISABLED_ENV_MARKERS = ("false", "0", "no")
_PLACEHOLDER_KEYS = frozenset({"YOUR_API_KEY", ""})


def _using_vertex_genai() -> bool:
    for env in ("GOOGLE_GENAI_USE_VERTEXAI", "GOOGLE_GENAI_USE_ENTERPRISE"):
        if os.getenv(env, "").strip().lower() in _VEO_VERTEX_ENV_MARKERS:
            return True
    return False


def resolve_veo_api_key() -> str:
    """First non-empty Veo/Gemini API key (``GOOGLE_VEO_API_KEY`` > ``GOOGLE_API_KEY`` > ``GEMINI_API_KEY``)."""
    for env in ("GOOGLE_VEO_API_KEY", "GOOGLE_API_KEY", "GEMINI_API_KEY"):
        key = os.getenv(env, "").strip()
        if key and key.upper() not in _PLACEHOLDER_KEYS:
            return key
    return ""


def sora_configured() -> bool:
    api_key = os.getenv("VIDEO_API_KEY", "").strip()
    return bool(api_key) and api_key.upper() not in _PLACEHOLDER_KEYS


def veo_generation_enabled() -> bool:
    """Whether Grok may route ads to Google Veo (``VEO_GENERATION_ENABLED``; default on)."""
    raw = os.getenv("VEO_GENERATION_ENABLED", "true").strip().lower()
    if raw in _VEO_DISABLED_ENV_MARKERS:
        return False
    return raw in _VEO_VERTEX_ENV_MARKERS


def using_vertex_genai() -> bool:
    return _using_vertex_genai()


def veo_configured() -> bool:
    return (
        veo_generation_enabled()
        and bool(resolve_veo_api_key())
        and not _using_vertex_genai()
    )


def provider_from_configured_keys() -> VideoProvider | None:
    """Pick a backend from configured keys only (Veo preferred when both are set)."""
    if veo_configured():
        return "veo"
    if sora_configured():
        return "sora"
    return None


def require_video_api_configured() -> None:
    if provider_from_configured_keys() is None:
        raise RuntimeError(
            "No video generation API configured "
            "(set VIDEO_API_KEY and/or GOOGLE_VEO_API_KEY, GOOGLE_API_KEY, or GEMINI_API_KEY)."
        )
