"""Tests for Persona model helpers and schemas.

Run from the backend directory:
    cd backend && python -m pytest tests/test_persona.py -v
"""

import json
import sys
from pathlib import Path
from uuid import uuid4

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

import pytest
from models.persona import Persona
from schemas.persona import PersonaBrief, PersonaResponse
from schemas.consumer import ConsumerResponse


# ---------------------------------------------------------------------------
# Persona model — JSON helper methods (no DB needed)
# ---------------------------------------------------------------------------

def _make_persona(**kwargs) -> Persona:
    defaults = dict(
        id=str(uuid4()),
        name="Pragmatic Optimizer",
        description="Makes calculated decisions based on value.",
        key_motivators=json.dumps(["Efficiency", "Value-for-money"]),
        pain_points=json.dumps(["Wasted money", "Complicated processes"]),
        ad_tone_preferences=json.dumps(["Data-driven", "Direct"]),
        created_at=None,
    )
    defaults.update(kwargs)
    return Persona(**defaults)


def test_get_key_motivators_parses_json():
    persona = _make_persona()
    assert persona.get_key_motivators() == ["Efficiency", "Value-for-money"]


def test_get_pain_points_parses_json():
    persona = _make_persona()
    assert persona.get_pain_points() == ["Wasted money", "Complicated processes"]


def test_get_ad_tone_preferences_parses_json():
    persona = _make_persona()
    assert persona.get_ad_tone_preferences() == ["Data-driven", "Direct"]


def test_get_ad_tone_preferences_returns_empty_list_when_null():
    persona = _make_persona(ad_tone_preferences=None)
    assert persona.get_ad_tone_preferences() == []


def test_persona_repr():
    persona = _make_persona(name="Experience Seeker")
    assert repr(persona) == "<Persona(name='Experience Seeker')>"


# ---------------------------------------------------------------------------
# Persona schemas — pure Pydantic (no DB needed)
# ---------------------------------------------------------------------------

def test_persona_response_deserializes_json_fields():
    pid = uuid4()
    data = PersonaResponse(
        id=pid,
        name="Aspiring Achiever",
        description="Driven by career growth.",
        key_motivators=json.dumps(["Career growth", "Status"]),
        pain_points=json.dumps(["Feeling stuck", "FOMO"]),
        ad_tone_preferences=json.dumps(["Inspirational"]),
        created_at=None,
    )
    assert data.key_motivators == ["Career growth", "Status"]
    assert data.pain_points == ["Feeling stuck", "FOMO"]
    assert data.ad_tone_preferences == ["Inspirational"]


def test_persona_response_nullable_ad_tone_preferences():
    pid = uuid4()
    data = PersonaResponse(
        id=pid,
        name="Protective Provider",
        description="Prioritizes security.",
        key_motivators=json.dumps(["Family security"]),
        pain_points=json.dumps(["Uncertainty"]),
        ad_tone_preferences=None,
        created_at=None,
    )
    assert data.ad_tone_preferences is None


def test_persona_brief_serializes_id_and_name():
    pid = uuid4()
    brief = PersonaBrief(id=pid, name="Conscious Consumer")
    assert brief.id == pid
    assert brief.name == "Conscious Consumer"


def test_consumer_response_with_embedded_persona():
    pid = uuid4()
    brief = PersonaBrief(id=pid, name="Experience Seeker")
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    consumer = ConsumerResponse(
        id=1,
        email="test@example.com",
        phone="555-0001",
        first_name="Test",
        last_name="User",
        traits={"age": 30},
        primary_persona=brief,
        secondary_persona=None,
        persona_confidence=0.85,
        persona_assigned_at=now,
        created_at=now,
        updated_at=now,
    )
    assert consumer.primary_persona.name == "Experience Seeker"
    assert consumer.persona_confidence == 0.85
    assert consumer.secondary_persona is None


def test_consumer_response_with_no_persona():
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    consumer = ConsumerResponse(
        id=2,
        email="nopersona@example.com",
        traits=None,
        primary_persona=None,
        secondary_persona=None,
        persona_confidence=None,
        persona_assigned_at=None,
        created_at=now,
        updated_at=now,
    )
    assert consumer.primary_persona is None
    assert consumer.persona_confidence is None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
