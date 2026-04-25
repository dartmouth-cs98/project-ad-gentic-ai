"""Tests for Persona model helpers, schemas, and the GET /personas/ route.

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
from fastapi.testclient import TestClient
from sqlalchemy import String, create_engine
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base, get_db
from dependencies import get_current_client_id
from models.persona import Persona
from schemas.persona import PersonaBrief, PersonaResponse
from schemas.consumer import ConsumerResponse
from main import app


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


# ---------------------------------------------------------------------------
# Route tests — GET /personas/  (SQLite in-memory DB)
# ---------------------------------------------------------------------------

_persona_original_schema = Persona.__table__.schema
_persona_uuid_cols = {
    col.name: col.type
    for col in Persona.__table__.columns
    if isinstance(col.type, UNIQUEIDENTIFIER)
}

_route_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
_RouteSession = sessionmaker(autocommit=False, autoflush=False, bind=_route_engine)


def _swap_uuid_cols(table, col_map, target_type=None) -> None:
    for col in table.columns:
        if col.name in col_map:
            col.type = col_map[col.name] if target_type is None else target_type


@pytest.fixture()
def route_db():
    """Create the personas table, yield a session, then tear down."""
    Persona.__table__.schema = None
    _swap_uuid_cols(Persona.__table__, _persona_uuid_cols, String(36))
    Base.metadata.create_all(bind=_route_engine, tables=[Persona.__table__])
    yield
    Base.metadata.drop_all(bind=_route_engine, tables=[Persona.__table__])
    _swap_uuid_cols(Persona.__table__, _persona_uuid_cols)
    Persona.__table__.schema = _persona_original_schema


@pytest.fixture()
def personas_client(route_db):
    """TestClient with DB dependency overridden to the in-memory SQLite engine."""
    def _override_get_db():
        db = _RouteSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = _override_get_db
    app.dependency_overrides[get_current_client_id] = lambda: 1
    yield TestClient(app)
    app.dependency_overrides.clear()


def _insert_persona(name: str, **kwargs) -> dict:
    """Return a dict suitable for constructing a Persona row."""
    return dict(
        id=str(uuid4()),
        name=name,
        description=kwargs.get("description", f"{name} description."),
        key_motivators=json.dumps(kwargs.get("key_motivators", ["Efficiency"])),
        pain_points=json.dumps(kwargs.get("pain_points", ["Waste"])),
        ad_tone_preferences=json.dumps(kwargs.get("ad_tone_preferences")) if "ad_tone_preferences" in kwargs else None,
        created_at=None,
    )


class TestPersonasRoute:
    """GET /personas/"""

    def test_list_empty(self, personas_client: TestClient):
        resp = personas_client.get("/personas/")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_returns_all_personas(self, personas_client: TestClient):
        db = _RouteSession()
        db.add(Persona(**_insert_persona("Pragmatic Optimizer")))
        db.add(Persona(**_insert_persona("Aspiring Achiever")))
        db.commit()
        db.close()

        resp = personas_client.get("/personas/")
        assert resp.status_code == 200
        names = [p["name"] for p in resp.json()]
        assert set(names) == {"Pragmatic Optimizer", "Aspiring Achiever"}

    def test_list_ordered_by_name(self, personas_client: TestClient):
        db = _RouteSession()
        for name in ["Pragmatic Optimizer", "Aspiring Achiever", "Conscious Consumer"]:
            db.add(Persona(**_insert_persona(name)))
        db.commit()
        db.close()

        resp = personas_client.get("/personas/")
        assert resp.status_code == 200
        names = [p["name"] for p in resp.json()]
        assert names == sorted(names)

    def test_list_deserializes_json_fields(self, personas_client: TestClient):
        db = _RouteSession()
        db.add(Persona(**_insert_persona(
            "Experience Seeker",
            key_motivators=["Novelty", "Discovery"],
            pain_points=["Boredom", "Routine"],
            ad_tone_preferences=["Exciting", "Bold"],
        )))
        db.commit()
        db.close()

        resp = personas_client.get("/personas/")
        assert resp.status_code == 200
        p = resp.json()[0]
        assert p["key_motivators"] == ["Novelty", "Discovery"]
        assert p["pain_points"] == ["Boredom", "Routine"]
        assert p["ad_tone_preferences"] == ["Exciting", "Bold"]

    def test_list_nullable_ad_tone_preferences(self, personas_client: TestClient):
        db = _RouteSession()
        db.add(Persona(**_insert_persona("Protective Provider")))
        db.commit()
        db.close()

        resp = personas_client.get("/personas/")
        assert resp.status_code == 200
        p = resp.json()[0]
        assert p["ad_tone_preferences"] is None

    def test_list_response_includes_required_fields(self, personas_client: TestClient):
        db = _RouteSession()
        db.add(Persona(**_insert_persona("Conscious Consumer")))
        db.commit()
        db.close()

        resp = personas_client.get("/personas/")
        assert resp.status_code == 200
        p = resp.json()[0]
        for field in ("id", "name", "description", "key_motivators", "pain_points"):
            assert field in p, f"Missing field: {field}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
