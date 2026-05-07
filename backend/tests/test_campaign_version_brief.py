"""Tests for campaign brief parsing (legacy strings vs structured plan + preferences)."""

import sys
from pathlib import Path

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

from schemas.generation_preferences import GenerationPreferences, parse_generation_preferences
from utils.campaign_version_brief import (
    brief_text_for_version,
    resolve_brief_and_preferences_for_version,
)


class TestParseGenerationPreferences:
    def test_parse_valid_dict(self):
        p = parse_generation_preferences(
            {"tone": "minimal", "language": "English (US)", "platforms": ["Instagram Story"]}
        )
        assert p is not None
        assert p.tone == "minimal"
        assert p.language == "English (US)"
        assert p.platforms == ["Instagram Story"]

    def test_empty_dict_returns_none(self):
        assert parse_generation_preferences({}) is None


class TestResolveBriefAndPreferences:
    def test_legacy_string_entry(self):
        brief_json = '{"1": "Plain plan text"}'
        text, prefs = resolve_brief_and_preferences_for_version(brief_json, 1)
        assert text == "Plain plan text"
        assert prefs is None

    def test_structured_entry(self):
        brief_json = """{"1": {"plan_message": "Hello plan", "generation_preferences": {"tone": "playful", "language": "Spanish"}}}"""
        text, prefs = resolve_brief_and_preferences_for_version(brief_json, 1)
        assert text == "Hello plan"
        assert prefs is not None
        assert prefs.tone == "playful"
        assert prefs.language == "Spanish"

    def test_missing_version(self):
        text, prefs = resolve_brief_and_preferences_for_version('{"2": "x"}', 1)
        assert text == ""
        assert prefs is None

    def test_brief_text_alias(self):
        assert brief_text_for_version('{"1": "Z"}', 1) == "Z"

    def test_brief_text_matches_legacy_string_contract(self):
        """Same plan text as historical `_brief_for_version` for string-valued entries."""
        assert brief_text_for_version('{"1": "Brief v1", "2": "Brief v2"}', 1) == "Brief v1"
        payload = '{"1": {"plan_message": "Structured brief", "generation_preferences": {"tone": "bold"}}}'
        assert brief_text_for_version(payload, 1) == "Structured brief"


class TestGenerationPreferencesModel:
    def test_extra_keys_ignored(self):
        p = GenerationPreferences.model_validate({"tone": "bold", "unknown": 1})
        assert p.tone == "bold"
