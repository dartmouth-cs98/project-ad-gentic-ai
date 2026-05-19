"""Structured Ad Studio preferences snapshot (persisted per campaign version, used in script generation)."""

from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, ValidationError


class GenerationPreferences(BaseModel):
    """Mirrors the frontend filter panel when the user approves a plan (snake_case JSON)."""

    model_config = ConfigDict(extra="ignore")

    personalization_range: Optional[str] = None
    variants_per_group: Optional[int] = None
    ad_formats: Optional[list[str]] = None
    tone: Optional[str] = None
    budget_tier: Optional[str] = None
    cta_style: Optional[str] = None
    language: Optional[str] = None
    platforms: Optional[list[str]] = None
    color_mode: Optional[str] = None
    custom_color: Optional[str] = None


def parse_generation_preferences(data: Any) -> Optional[GenerationPreferences]:
    """Best-effort parse from JSON dict; returns None if invalid or empty."""
    if data is None:
        return None
    if isinstance(data, GenerationPreferences):
        return data
    if not isinstance(data, dict):
        return None
    try:
        prefs = GenerationPreferences.model_validate(data)
    except ValidationError:
        return None
    # Treat all-null object as absent
    dumped = prefs.model_dump(exclude_none=True)
    if not dumped:
        return None
    return prefs
