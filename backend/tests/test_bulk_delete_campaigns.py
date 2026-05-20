"""Tests for POST /campaigns/bulk-delete."""

import os
import sys
from datetime import date, datetime, timezone
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost")
os.environ.setdefault("JWT_SECRET", "test-secret")

from database import Base, get_db
from dependencies import get_current_client_id
from main import app
from models.ad_variant import AdVariant
from models.campaign import Campaign
from models.campaign_metric import CampaignMetric
from models.chat_message import ChatMessage
from models.consumer_event import ConsumerEvent

_MODELS = (Campaign, AdVariant, ChatMessage, CampaignMetric, ConsumerEvent)
_ORIGINAL_SCHEMAS = {m: m.__table__.schema for m in _MODELS}
_CLIENT_ID = 42


@pytest.fixture()
def db_session():
    for model in _MODELS:
        model.__table__.schema = None
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine, tables=[m.__table__ for m in _MODELS])
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine, tables=[m.__table__ for m in _MODELS])
        for model in _MODELS:
            model.__table__.schema = _ORIGINAL_SCHEMAS[model]


@pytest.fixture()
def client(db_session):
    def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    app.dependency_overrides[get_current_client_id] = lambda: _CLIENT_ID
    yield TestClient(app)
    app.dependency_overrides.clear()


def _seed_campaign(db_session, *, name: str = "Test Campaign") -> Campaign:
    now = datetime.now(timezone.utc)
    campaign = Campaign(
        business_client_id=_CLIENT_ID,
        name=name,
        status="draft",
        created_at=now,
        updated_at=now,
    )
    db_session.add(campaign)
    db_session.commit()
    db_session.refresh(campaign)
    return campaign


def _seed_variant(db_session, campaign_id: int) -> AdVariant:
    variant = AdVariant(
        campaign_id=campaign_id,
        status="completed",
        version_number=1,
        is_preview=False,
        is_approved=False,
    )
    db_session.add(variant)
    db_session.commit()
    db_session.refresh(variant)
    return variant


def _seed_chat_message(db_session, campaign_id: int) -> ChatMessage:
    msg = ChatMessage(
        campaign_id=campaign_id,
        business_client_id=_CLIENT_ID,
        role="user",
        message_type="message",
        content="hello",
    )
    db_session.add(msg)
    db_session.commit()
    db_session.refresh(msg)
    return msg


def test_bulk_delete_two_campaigns(client, db_session):
    a = _seed_campaign(db_session, name="A")
    b = _seed_campaign(db_session, name="B")
    _seed_variant(db_session, a.id)
    _seed_variant(db_session, b.id)
    _seed_chat_message(db_session, a.id)

    resp = client.post(
        "/campaigns/bulk-delete",
        json={"campaign_ids": [a.id, b.id]},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert set(body["deleted_ids"]) == {a.id, b.id}
    assert body["not_found_ids"] == []
    assert db_session.get(Campaign, a.id) is None
    assert db_session.get(Campaign, b.id) is None


def test_bulk_delete_partial_not_found(client, db_session):
    c = _seed_campaign(db_session)
    resp = client.post("/campaigns/bulk-delete", json={"campaign_ids": [c.id, 999]})
    assert resp.status_code == 200
    body = resp.json()
    assert body["deleted_ids"] == [c.id]
    assert body["not_found_ids"] == [999]
    assert db_session.get(Campaign, c.id) is None


def test_bulk_delete_empty_ids_rejected(client):
    resp = client.post("/campaigns/bulk-delete", json={"campaign_ids": []})
    assert resp.status_code == 422


def test_bulk_delete_dedupes_ids(client, db_session):
    c = _seed_campaign(db_session)
    resp = client.post(
        "/campaigns/bulk-delete",
        json={"campaign_ids": [c.id, c.id]},
    )
    assert resp.status_code == 200
    assert resp.json()["deleted_ids"] == [c.id]
    assert db_session.get(Campaign, c.id) is None


def test_bulk_delete_all_not_found(client, db_session):
    resp = client.post("/campaigns/bulk-delete", json={"campaign_ids": [888, 999]})
    assert resp.status_code == 200
    body = resp.json()
    assert body["deleted_ids"] == []
    assert set(body["not_found_ids"]) == {888, 999}
