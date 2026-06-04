"""Unit tests for the process_consumer_personas batch service.

All LLM calls are mocked — no real DB or OpenAI required beyond SQLite in-memory.

Run from the backend directory:
    cd backend && python -m pytest tests/test_consumer_persona_processor.py -v
"""

import asyncio
import json
import sys
from pathlib import Path
from unittest.mock import AsyncMock, call, patch
from uuid import uuid4

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

import pytest
from sqlalchemy import String, create_engine
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base
from models.consumer import Consumer
from models.persona import Persona
from services.consumer_persona_processor.service import process_consumer_personas
from services.persona_assignment.service import PersonaAssignmentResult


# ---------------------------------------------------------------------------
# SQLite in-memory DB setup
# ---------------------------------------------------------------------------

_consumer_original_schema = Consumer.__table__.schema
_persona_original_schema = Persona.__table__.schema
_consumer_uuid_cols = {
    col.name: col.type
    for col in Consumer.__table__.columns
    if isinstance(col.type, UNIQUEIDENTIFIER)
}
_persona_uuid_cols = {
    col.name: col.type
    for col in Persona.__table__.columns
    if isinstance(col.type, UNIQUEIDENTIFIER)
}

_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
    query_cache_size=0,
)
_Session = sessionmaker(autocommit=False, autoflush=False, bind=_engine)


def _swap_uuid_cols(table, col_map, target_type=None) -> None:
    for col in table.columns:
        if col.name in col_map:
            col.type = col_map[col.name] if target_type is None else target_type


@pytest.fixture(autouse=True)
def setup_db():
    Persona.__table__.schema = None
    Consumer.__table__.schema = None
    _swap_uuid_cols(Persona.__table__, _persona_uuid_cols, String(36))
    _swap_uuid_cols(Consumer.__table__, _consumer_uuid_cols, String(36))
    Base.metadata.create_all(bind=_engine, tables=[Persona.__table__, Consumer.__table__])
    yield
    Base.metadata.drop_all(bind=_engine, tables=[Consumer.__table__, Persona.__table__])
    _swap_uuid_cols(Persona.__table__, _persona_uuid_cols)
    _swap_uuid_cols(Consumer.__table__, _consumer_uuid_cols)
    Persona.__table__.schema = _persona_original_schema
    Consumer.__table__.schema = _consumer_original_schema


@pytest.fixture()
def db():
    session = _Session()
    try:
        yield session
    finally:
        session.close()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_TEST_CLIENT_ID = 1


def _make_persona_row(name: str, db) -> Persona:
    persona = Persona(
        id=str(uuid4()),
        name=name,
        description=f"{name} description",
        key_motivators=json.dumps(["Efficiency"]),
        pain_points=json.dumps(["Waste"]),
        ad_tone_preferences=None,
    )
    db.add(persona)
    db.commit()
    # Use the id we already set — skip refresh to avoid SQLAlchemy type-cache issues.
    return persona


def _make_consumer_row(db, *, traits: dict | None = None, primary_persona_id=None) -> Consumer:
    consumer = Consumer(
        business_client_id=_TEST_CLIENT_ID,
        email=f"user_{uuid4().hex[:6]}@example.com",
        phone="555-0000",
        first_name="Test",
        last_name="User",
        traits=json.dumps(traits) if traits is not None else None,
        primary_persona_id=primary_persona_id,
    )
    db.add(consumer)
    db.commit()
    db.refresh(consumer)
    return consumer


def _make_assignment(primary_name: str, confidence: float = 0.85, secondary_name=None) -> PersonaAssignmentResult:
    return PersonaAssignmentResult(
        primary_persona_name=primary_name,
        secondary_persona_name=secondary_name,
        primary_confidence=confidence,
        secondary_confidence=0.60 if secondary_name else None,
        reasoning="Test reasoning.",
    )


def _run(coro):
    """Run an async coroutine synchronously (no pytest-asyncio needed)."""
    return asyncio.run(coro)


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


def test_empty_consumer_ids_returns_zeros(db):
    result = _run(process_consumer_personas(db, [], AsyncMock()))
    assert result.processed == 0
    assert result.failed == 0
    assert result.skipped == 0
    assert result.low_confidence == 0


def test_consumer_not_found_increments_failed(db):
    result = _run(process_consumer_personas(db, [99999], AsyncMock()))
    assert result.failed == 1
    assert result.processed == 0
    assert any("not found" in e for e in result.errors)


def test_already_assigned_consumer_is_skipped(db):
    persona = _make_persona_row("Pragmatic Optimizer", db)
    consumer = _make_consumer_row(db, traits={"age": 30}, primary_persona_id=persona.id)

    result = _run(process_consumer_personas(db, [consumer.id], AsyncMock()))
    assert result.skipped == 1
    assert result.processed == 0
    assert result.failed == 0


def test_consumer_without_traits_increments_failed(db):
    consumer = _make_consumer_row(db, traits=None)

    result = _run(process_consumer_personas(db, [consumer.id], AsyncMock()))
    assert result.failed == 1
    assert result.processed == 0
    assert any("no traits" in e for e in result.errors)


def test_successful_assignment_increments_processed(db):
    persona = _make_persona_row("Pragmatic Optimizer", db)
    consumer = _make_consumer_row(db, traits={"age": 30})

    with patch(
        "services.consumer_persona_processor.service.assign_persona",
        new=AsyncMock(return_value=_make_assignment("Pragmatic Optimizer", confidence=0.85)),
    ):
        result = _run(process_consumer_personas(db, [consumer.id], AsyncMock()))

    assert result.processed == 1
    assert result.failed == 0
    assert result.skipped == 0
    assert result.low_confidence == 0

    db.refresh(consumer)
    assert consumer.primary_persona_id == persona.id
    assert float(consumer.persona_confidence) == pytest.approx(0.85)
    assert consumer.persona_assigned_at is not None


def test_low_confidence_assignment_increments_low_confidence(db):
    _make_persona_row("Pragmatic Optimizer", db)
    consumer = _make_consumer_row(db, traits={"age": 30})

    with patch(
        "services.consumer_persona_processor.service.assign_persona",
        new=AsyncMock(return_value=_make_assignment("Pragmatic Optimizer", confidence=0.40)),
    ):
        result = _run(process_consumer_personas(db, [consumer.id], AsyncMock()))

    assert result.processed == 1
    assert result.low_confidence == 1


def test_secondary_persona_is_assigned_when_returned(db):
    primary = _make_persona_row("Pragmatic Optimizer", db)
    secondary = _make_persona_row("Aspiring Achiever", db)
    consumer = _make_consumer_row(db, traits={"age": 30})

    with patch(
        "services.consumer_persona_processor.service.assign_persona",
        new=AsyncMock(return_value=_make_assignment(
            "Pragmatic Optimizer",
            confidence=0.80,
            secondary_name="Aspiring Achiever",
        )),
    ):
        result = _run(process_consumer_personas(db, [consumer.id], AsyncMock()))

    assert result.processed == 1
    db.refresh(consumer)
    assert consumer.primary_persona_id == primary.id
    assert consumer.secondary_persona_id == secondary.id


def test_unknown_persona_name_from_llm_increments_failed(db):
    consumer = _make_consumer_row(db, traits={"age": 30})

    with patch(
        "services.consumer_persona_processor.service.assign_persona",
        new=AsyncMock(return_value=_make_assignment("Nonexistent Persona", confidence=0.90)),
    ):
        result = _run(process_consumer_personas(db, [consumer.id], AsyncMock()))

    assert result.failed == 1
    assert result.processed == 0
    assert any("unknown persona" in e for e in result.errors)


def test_llm_exception_increments_failed(db):
    consumer = _make_consumer_row(db, traits={"age": 30})

    with patch(
        "services.consumer_persona_processor.service.assign_persona",
        new=AsyncMock(side_effect=RuntimeError("OpenAI timeout")),
    ):
        result = _run(process_consumer_personas(db, [consumer.id], AsyncMock()))

    assert result.failed == 1
    assert result.processed == 0
    assert any("OpenAI timeout" in e for e in result.errors)


def test_batch_processes_multiple_consumers_independently(db):
    """Failures for one consumer must not block processing of others."""
    persona = _make_persona_row("Pragmatic Optimizer", db)
    ok_consumer = _make_consumer_row(db, traits={"age": 30})
    bad_consumer = _make_consumer_row(db, traits=None)  # will fail — no traits

    with patch(
        "services.consumer_persona_processor.service.assign_persona",
        new=AsyncMock(return_value=_make_assignment("Pragmatic Optimizer", confidence=0.80)),
    ):
        result = _run(process_consumer_personas(db, [ok_consumer.id, bad_consumer.id], AsyncMock()))

    assert result.processed == 1
    assert result.failed == 1
    db.refresh(ok_consumer)
    assert ok_consumer.primary_persona_id == persona.id


def test_unknown_secondary_persona_name_is_silently_ignored(db):
    """A secondary persona name not in the DB should not fail the assignment."""
    _make_persona_row("Pragmatic Optimizer", db)
    consumer = _make_consumer_row(db, traits={"age": 30})

    with patch(
        "services.consumer_persona_processor.service.assign_persona",
        new=AsyncMock(return_value=_make_assignment(
            "Pragmatic Optimizer",
            confidence=0.80,
            secondary_name="Ghost Persona",  # not in DB
        )),
    ):
        result = _run(process_consumer_personas(db, [consumer.id], AsyncMock()))

    assert result.processed == 1
    assert result.failed == 0
    db.refresh(consumer)
    assert consumer.secondary_persona_id is None


def test_live_personas_are_passed_to_assign_persona(db):
    """assign_persona must receive the live persona list fetched from the DB,
    not a hardcoded list — so DB changes are always reflected in the prompt."""
    _make_persona_row("Pragmatic Optimizer", db)
    _make_persona_row("Aspiring Achiever", db)
    consumer = _make_consumer_row(db, traits={"age": 30})

    captured_personas = []

    async def _capture(*args, **kwargs):
        # args = (openai_client, traits_dict, personas)
        captured_personas.extend(args[2])
        return _make_assignment("Pragmatic Optimizer")

    with patch(
        "services.consumer_persona_processor.service.assign_persona",
        new=_capture,
    ):
        _run(process_consumer_personas(db, [consumer.id], AsyncMock()))

    assert len(captured_personas) == 2
    assert {p.name for p in captured_personas} == {"Pragmatic Optimizer", "Aspiring Achiever"}


def test_missing_and_valid_consumer_ids_are_counted_independently(db):
    """A mix of found and not-found IDs should accumulate correctly."""
    persona = _make_persona_row("Pragmatic Optimizer", db)
    ok_consumer = _make_consumer_row(db, traits={"age": 30})

    with patch(
        "services.consumer_persona_processor.service.assign_persona",
        new=AsyncMock(return_value=_make_assignment("Pragmatic Optimizer")),
    ):
        result = _run(
            process_consumer_personas(db, [ok_consumer.id, 99999], AsyncMock())
        )

    assert result.processed == 1
    assert result.failed == 1
    assert any("not found" in e for e in result.errors)
    db.refresh(ok_consumer)
    assert ok_consumer.primary_persona_id == persona.id


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
