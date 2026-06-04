"""Parse campaign.brief JSON: version-keyed legacy strings or structured plan + generation_preferences."""

from __future__ import annotations

import json
from typing import Any, Optional

from schemas.generation_preferences import GenerationPreferences, parse_generation_preferences


def _parse_version_entry(raw: Any) -> tuple[str, Optional[GenerationPreferences], bool]:
    """Return plan text, optional preferences, and whether this entry is structured (object form)."""
    if raw is None:
        return "", None, False
    if isinstance(raw, str):
        return raw, None, False
    if isinstance(raw, dict):
        plan = raw.get("plan_message")
        if not isinstance(plan, str):
            plan = ""
        prefs_raw = raw.get("generation_preferences")
        prefs = parse_generation_preferences(prefs_raw) if prefs_raw is not None else None
        return plan, prefs, True
    return "", None, False


def resolve_brief_and_preferences_for_version(
    brief_json: Optional[str],
    version_number: int,
) -> tuple[str, Optional[GenerationPreferences], bool]:
    """Resolve plan copy and optional GenerationPreferences for a creative version.

    ``campaign.brief`` is JSON: keys are version numbers (string or int), values are either:
    - legacy: plain string (full assistant plan message), or
    - structured: ``{"plan_message": str, "generation_preferences": {...}}``.

    The third tuple element is ``structured_brief``: ``True`` when the version value is an object
    (structured form). Used to fail closed when ``plan_message`` cannot be parsed to plan JSON.
    """
    if not brief_json or not brief_json.strip():
        return "", None, False
    try:
        data = json.loads(brief_json)
    except (json.JSONDecodeError, TypeError):
        return "", None, False
    if not isinstance(data, dict):
        return "", None, False
    key_int = version_number
    key_str = str(version_number)
    raw = data.get(key_str)
    if raw is None:
        raw = data.get(key_int)
    if raw is None:
        return "", None, False
    return _parse_version_entry(raw)


def brief_text_for_version(brief_json: Optional[str], version_number: int) -> str:
    """Backward-compatible: plan text only (used where preferences are ignored)."""
    text, _, _ = resolve_brief_and_preferences_for_version(brief_json, version_number)
    return text
