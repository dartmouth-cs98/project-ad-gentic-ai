"""Tests for crud.ad_variant.attach_personas — the helper that resolves
``AdVariant.consumer_id → Consumer.primary_persona_id → Persona`` and pins
``persona_id`` / ``persona_name`` onto each variant for response serialization.
"""

import os
import sys
from pathlib import Path

import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost")

from crud.ad_variant import attach_personas
from database import Base
from models.ad_variant import AdVariant
from models.business_client import BusinessClient
from models.consumer import Consumer
from models.persona import Persona


# SQLite doesn't support schemas — strip the `dbo` prefix while testing.
_MODELS = [AdVariant, BusinessClient, Consumer, Persona]
_ORIGINAL_SCHEMAS = {m: m.__table__.schema for m in _MODELS}


@pytest.fixture()
def db():
    for model in _MODELS:
        model.__table__.schema = None
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    tables = [m.__table__ for m in _MODELS]
    Base.metadata.create_all(bind=engine, tables=tables)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine, tables=tables)
        for model, schema in _ORIGINAL_SCHEMAS.items():
            model.__table__.schema = schema


# ---------- Fixtures ----------

_consumer_counter = {"n": 0}


def _mk_client(db) -> BusinessClient:
    c = BusinessClient(
        id=1,
        email="t@test.com",
        password_hash="x",
        business_name="Test",
        subscription_tier="basic",
        credits_balance=0,
        email_verified=True,
    )
    db.add(c)
    db.commit()
    return c


def _mk_persona(db, name: str) -> Persona:
    p = Persona(
        id=f"persona-{name}",
        name=name,
        description="desc",
        key_motivators="[]",
        pain_points="[]",
    )
    db.add(p)
    db.commit()
    return p


def _mk_consumer(db, persona_id: str | None) -> Consumer:
    _consumer_counter["n"] += 1
    c = Consumer(
        business_client_id=1,
        email=f"c{_consumer_counter['n']}@test.com",
        primary_persona_id=persona_id,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


def _mk_variant(db, consumer_id: int | None) -> AdVariant:
    v = AdVariant(
        campaign_id=1,
        consumer_id=consumer_id,
        status="completed",
        media_url="https://cdn.example.com/v.mp4",
        meta='{"script": "x"}',
        version_number=1,
        is_preview=False,
        is_approved=True,
    )
    db.add(v)
    db.commit()
    db.refresh(v)
    return v


# ---------- Tests ----------

def test_attaches_persona_when_consumer_has_one(db):
    _mk_client(db)
    persona = _mk_persona(db, "Busy Parent")
    consumer = _mk_consumer(db, persona.id)
    variant = _mk_variant(db, consumer_id=consumer.id)

    attach_personas(db, [variant])

    assert variant.persona_id == persona.id
    assert variant.persona_name == "Busy Parent"


def test_attaches_none_when_consumer_has_no_primary_persona(db):
    _mk_client(db)
    consumer = _mk_consumer(db, persona_id=None)
    variant = _mk_variant(db, consumer_id=consumer.id)

    attach_personas(db, [variant])

    assert variant.persona_id is None
    assert variant.persona_name is None


def test_attaches_none_when_variant_has_no_consumer(db):
    _mk_client(db)
    variant = _mk_variant(db, consumer_id=None)

    attach_personas(db, [variant])

    assert variant.persona_id is None
    assert variant.persona_name is None


def test_handles_mixed_list_correctly(db):
    """Three variants — one with persona, one consumer-no-persona, one no-consumer.

    All three attribute pairs should resolve correctly in a single call.
    """
    _mk_client(db)
    persona = _mk_persona(db, "College Student")
    c_with = _mk_consumer(db, persona.id)
    c_without = _mk_consumer(db, persona_id=None)

    v_with_persona = _mk_variant(db, consumer_id=c_with.id)
    v_consumer_no_persona = _mk_variant(db, consumer_id=c_without.id)
    v_no_consumer = _mk_variant(db, consumer_id=None)

    attach_personas(db, [v_with_persona, v_consumer_no_persona, v_no_consumer])

    assert v_with_persona.persona_id == persona.id
    assert v_with_persona.persona_name == "College Student"
    assert v_consumer_no_persona.persona_id is None
    assert v_consumer_no_persona.persona_name is None
    assert v_no_consumer.persona_id is None
    assert v_no_consumer.persona_name is None


def test_empty_list_does_not_query(db):
    """No variants → no DB query; no errors."""
    counter = _StatementCounter(db)
    counter.attach()
    try:
        attach_personas(db, [])
    finally:
        counter.detach()
    assert counter.count == 0


def test_uses_single_query_regardless_of_list_size(db):
    """N+1 guard — 5 consumers/personas, attach must issue exactly one SELECT."""
    _mk_client(db)
    variants = []
    for i in range(5):
        p = _mk_persona(db, f"P{i}")
        c = _mk_consumer(db, p.id)
        variants.append(_mk_variant(db, consumer_id=c.id))

    # Each commit during setup expires prior instances; refresh them all so
    # the counter measures only the work attach_personas itself does.
    for v in variants:
        db.refresh(v)

    counter = _StatementCounter(db)
    counter.attach()
    try:
        attach_personas(db, variants)
    finally:
        counter.detach()

    assert counter.count == 1, f"expected 1 SELECT, got {counter.count}"
    for i, v in enumerate(variants):
        assert v.persona_name == f"P{i}"


def test_deduplicates_repeated_consumer_ids(db):
    """Multiple variants for the same consumer still issue one SELECT."""
    _mk_client(db)
    persona = _mk_persona(db, "Foodie")
    consumer = _mk_consumer(db, persona.id)
    variants = [_mk_variant(db, consumer_id=consumer.id) for _ in range(3)]

    for v in variants:
        db.refresh(v)

    counter = _StatementCounter(db)
    counter.attach()
    try:
        attach_personas(db, variants)
    finally:
        counter.detach()

    assert counter.count == 1
    for v in variants:
        assert v.persona_name == "Foodie"


# ---------- Helpers ----------

class _StatementCounter:
    """Counts SELECT statements issued on the session's bind during a window.

    Used to assert that attach_personas avoids N+1 queries.
    """

    def __init__(self, db):
        self.engine = db.bind
        self.count = 0
        self._handler = self._on_execute

    def _on_execute(self, _conn, _cursor, statement, *_args, **_kwargs):
        if statement.strip().lower().startswith("select"):
            self.count += 1

    def attach(self) -> None:
        event.listen(self.engine, "before_cursor_execute", self._handler)

    def detach(self) -> None:
        event.remove(self.engine, "before_cursor_execute", self._handler)
