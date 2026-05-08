"""Tests for plan JSON parsing and persona matching helpers."""

import sys
from pathlib import Path

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

from unittest.mock import MagicMock

from models.persona import Persona
from utils.plan_execution import (
    find_persona_for_plan_group_name,
    parse_plan_json_from_message,
    pick_consumers_for_preview_group,
    variants_per_group_target,
)


def test_parse_plan_json_from_message():
    text = 'Intro\n```json\n{"persona_groups": [{"name": "Alpha"}]}\n```\nDone'
    d = parse_plan_json_from_message(text)
    assert d is not None
    assert d["persona_groups"][0]["name"] == "Alpha"


def test_parse_plan_json_nested_object_not_truncated():
    """Brace-balanced extraction must not stop at the first ``}`` inside nested arrays."""
    text = (
        "Plan\n```json\n"
        '{"persona_groups": [{"name": "Trail Fans", "variant_count": 3}], "notes": "x"}\n'
        "```\n"
    )
    d = parse_plan_json_from_message(text)
    assert d is not None
    assert d["persona_groups"][0]["name"] == "Trail Fans"
    assert d["persona_groups"][0]["variant_count"] == 3
    assert d["notes"] == "x"


def test_parse_plan_json_string_with_braces_ignored():
    """Braces inside JSON strings must not confuse depth counting."""
    text = '```json\n{"hint": "{not an object}", "persona_groups": []}\n```'
    d = parse_plan_json_from_message(text)
    assert d is not None
    assert d["hint"] == "{not an object}"
    assert d["persona_groups"] == []


def test_find_persona_exact_ci():
    p = MagicMock(spec=Persona)
    p.name = "Weekend Hikers"
    p.id = "u1"
    assert find_persona_for_plan_group_name("weekend hikers", [p]) is p


def test_find_persona_no_substring_false_positive():
    """Short plan labels must not match unrelated persona names via substring overlap."""
    women = MagicMock(spec=Persona)
    women.name = "Women Shoppers"
    researchers = MagicMock(spec=Persona)
    researchers.name = "The Researcher"
    roster = [women, researchers]
    assert find_persona_for_plan_group_name("Men", roster) is None
    assert find_persona_for_plan_group_name("Women Shoppers", roster) is women


def test_variants_per_group_pref_wins():
    from schemas.generation_preferences import GenerationPreferences

    prefs = GenerationPreferences(variants_per_group=3)
    assert variants_per_group_target({"variant_count": 9}, prefs) == 3


def test_variants_per_group_plan_fallback():
    assert variants_per_group_target({"variant_count": 2}, None) == 2


def test_pick_consumers_caps_distinct():
    c1, c2, c3 = MagicMock(), MagicMock(), MagicMock()
    picked = pick_consumers_for_preview_group([c1, c2, c3], 10)
    assert len(picked) == 3
