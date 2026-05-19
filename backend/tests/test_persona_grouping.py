"""Tests for persona grouping used during Meta publish."""

import os
import sys
from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost")

from database import Base
from models.ad_variant import AdVariant
from models.business_client import BusinessClient
from models.consumer import Consumer
from models.persona import Persona
from services.meta.persona_grouping import (
    UNCATEGORIZED_NAME,
    group_approved_variants_by_persona,
)


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


_consumer_counter = {"n": 0}


def _mk_consumer(db, client_id: int, persona_id: str | None) -> Consumer:
    _consumer_counter["n"] += 1
    c = Consumer(
        business_client_id=client_id,
        email=f"c{_consumer_counter['n']}@test.com",
        primary_persona_id=persona_id,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


def _mk_variant(
    db,
    *,
    campaign_id: int = 1,
    consumer_id: int | None,
    status: str = "completed",
    is_approved: bool = True,
    is_preview: bool = False,
    media_url: str | None = "https://cdn.example.com/v.mp4",
    meta: str | None = '{"script": "Try it today"}',
) -> AdVariant:
    v = AdVariant(
        campaign_id=campaign_id,
        consumer_id=consumer_id,
        status=status,
        media_url=media_url,
        meta=meta,
        version_number=1,
        is_preview=is_preview,
        is_approved=is_approved,
    )
    db.add(v)
    db.commit()
    db.refresh(v)
    return v


def test_groups_variants_by_persona(db):
    _mk_client(db)
    p1 = _mk_persona(db, "Busy Parent")
    p2 = _mk_persona(db, "College Student")
    c1 = _mk_consumer(db, 1, p1.id)
    c2 = _mk_consumer(db, 1, p2.id)
    c3 = _mk_consumer(db, 1, p1.id)

    _mk_variant(db, consumer_id=c1.id)
    _mk_variant(db, consumer_id=c3.id)
    _mk_variant(db, consumer_id=c2.id)

    result = group_approved_variants_by_persona(db, campaign_id=1)

    names = {g["persona_name"]: len(g["variants"]) for g in result}
    assert names == {"Busy Parent": 2, "College Student": 1}
    for group in result:
        assert group["persona_traits"] == {}


def test_uncategorized_for_variants_without_persona(db):
    _mk_client(db)
    _mk_persona(db, "Traveler")
    # Consumer without a persona
    c_no_persona = _mk_consumer(db, 1, None)

    # One with consumer but null persona, one with no consumer at all
    _mk_variant(db, consumer_id=c_no_persona.id)
    _mk_variant(db, consumer_id=None)

    result = group_approved_variants_by_persona(db, campaign_id=1)
    assert len(result) == 1
    assert result[0]["persona_name"] == UNCATEGORIZED_NAME
    assert len(result[0]["variants"]) == 2


def test_filters_out_unapproved_preview_incomplete_and_no_media(db):
    _mk_client(db)
    p = _mk_persona(db, "Foodie")
    c = _mk_consumer(db, 1, p.id)

    # Should be excluded
    _mk_variant(db, consumer_id=c.id, is_approved=False)
    _mk_variant(db, consumer_id=c.id, is_preview=True)
    _mk_variant(db, consumer_id=c.id, status="generating")
    _mk_variant(db, consumer_id=c.id, media_url=None)
    # Should be included
    kept = _mk_variant(db, consumer_id=c.id)

    result = group_approved_variants_by_persona(db, campaign_id=1)
    assert len(result) == 1
    assert [v["id"] for v in result[0]["variants"]] == [kept.id]


def test_extracts_script_from_meta_json(db):
    _mk_client(db)
    p = _mk_persona(db, "Runner")
    c = _mk_consumer(db, 1, p.id)

    _mk_variant(db, consumer_id=c.id, meta='{"script": "Run further"}')
    _mk_variant(db, consumer_id=c.id, meta="not json")
    _mk_variant(db, consumer_id=c.id, meta=None)

    result = group_approved_variants_by_persona(db, campaign_id=1)
    scripts = sorted(v["script"] for v in result[0]["variants"])
    assert scripts == ["", "", "Run further"]


def test_empty_campaign_returns_empty_list(db):
    _mk_client(db)
    assert group_approved_variants_by_persona(db, campaign_id=999) == []


def test_scopes_by_campaign_id(db):
    _mk_client(db)
    p = _mk_persona(db, "Investor")
    c = _mk_consumer(db, 1, p.id)
    _mk_variant(db, campaign_id=1, consumer_id=c.id)
    _mk_variant(db, campaign_id=2, consumer_id=c.id)

    result = group_approved_variants_by_persona(db, campaign_id=1)
    assert sum(len(g["variants"]) for g in result) == 1
