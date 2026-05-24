"""Serialize / parse ``campaigns.draft_generation_preferences`` JSON column."""

from __future__ import annotations

import json
from typing import Any, Optional

from schemas.generation_preferences import GenerationPreferences, parse_generation_preferences


def generation_preferences_to_json(prefs: GenerationPreferences) -> str:
    """Persistable JSON string for the campaigns column."""
    return prefs.model_dump_json(exclude_none=True)


def parse_draft_generation_preferences_column(
    raw: Optional[str],
) -> Optional[GenerationPreferences]:
    """Parse DB column text to ``GenerationPreferences``, or ``None`` if absent/invalid."""
    if raw is None or not str(raw).strip():
        return None
    try:
        data = json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return None
    return parse_generation_preferences(data)


def coerce_draft_generation_preferences_input(value: Any) -> Optional[str]:
    """Accept dict / model / JSON string from API requests; return column JSON text."""
    if value is None:
        return None
    if isinstance(value, GenerationPreferences):
        return generation_preferences_to_json(value)
    if isinstance(value, dict):
        prefs = GenerationPreferences.model_validate(value)
        return generation_preferences_to_json(prefs)
    if isinstance(value, str):
        if not value.strip():
            return None
        try:
            parsed = json.loads(value)
        except (json.JSONDecodeError, TypeError) as exc:
            raise ValueError("draft_generation_preferences must be valid JSON") from exc
        prefs = parse_generation_preferences(parsed)
        if prefs is None:
            raise ValueError("draft_generation_preferences must be a non-empty preferences object")
        return generation_preferences_to_json(prefs)
    raise ValueError("draft_generation_preferences has an unsupported type")
