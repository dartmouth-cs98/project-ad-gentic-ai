"""Tests for DELETE /campaigns/{id} — cascade delete of dependent rows."""

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


def _seed_campaign(db_session, *, name: str = "Test Campaign", business_client_id: int = _CLIENT_ID) -> Campaign:
    now = datetime.now(timezone.utc)
    campaign = Campaign(
        business_client_id=business_client_id,
        name=name,
        status="draft",
        created_at=now,
        updated_at=now,
    )
    db_session.add(campaign)
    db_session.commit()
    db_session.refresh(campaign)
    return campaign


def _seed_variant(db_session, campaign_id: int, *, status: str = "completed") -> AdVariant:
    variant = AdVariant(
        campaign_id=campaign_id,
        status=status,
        version_number=1,
        is_preview=False,
        is_approved=False,
    )
    db_session.add(variant)
    db_session.commit()
    db_session.refresh(variant)
    return variant


def _seed_chat_message(db_session, campaign_id: int, *, content: str = "hello") -> ChatMessage:
    msg = ChatMessage(
        campaign_id=campaign_id,
        business_client_id=_CLIENT_ID,
        role="user",
        message_type="message",
        content=content,
    )
    db_session.add(msg)
    db_session.commit()
    db_session.refresh(msg)
    return msg


def _seed_metric(db_session, campaign_id: int) -> CampaignMetric:
    metric = CampaignMetric(
        campaign_id=campaign_id,
        date=date.today(),
        fetched_at=datetime.now(timezone.utc),
    )
    db_session.add(metric)
    db_session.commit()
    db_session.refresh(metric)
    return metric


def _seed_consumer_event(db_session, ad_variant_id: int, *, event_id: int = 1) -> ConsumerEvent:
    # BigInteger PK does not autoincrement on SQLite; set id explicitly in tests.
    event = ConsumerEvent(
        id=event_id,
        ad_variant_id=ad_variant_id,
        event_type="view",
    )
    db_session.add(event)
    db_session.commit()
    db_session.refresh(event)
    return event


def test_delete_campaign_with_no_children(client, db_session):
    campaign = _seed_campaign(db_session)
    resp = client.delete(f"/campaigns/{campaign.id}")
    assert resp.status_code == 204
    assert db_session.get(Campaign, campaign.id) is None


def test_delete_campaign_cascades_ad_variants(client, db_session):
    campaign = _seed_campaign(db_session)
    _seed_variant(db_session, campaign.id)
    _seed_variant(db_session, campaign.id, status="failed")

    resp = client.delete(f"/campaigns/{campaign.id}")
    assert resp.status_code == 204
    assert db_session.get(Campaign, campaign.id) is None
    assert db_session.scalars(select(AdVariant).where(AdVariant.campaign_id == campaign.id)).all() == []


def test_delete_campaign_cascades_chat_messages(client, db_session):
    campaign = _seed_campaign(db_session)
    _seed_chat_message(db_session, campaign.id, content="a")
    _seed_chat_message(db_session, campaign.id, content="b")

    resp = client.delete(f"/campaigns/{campaign.id}")
    assert resp.status_code == 204
    assert (
        db_session.scalars(
            select(ChatMessage).where(ChatMessage.campaign_id == campaign.id)
        ).all()
        == []
    )


def test_delete_campaign_cascades_metrics(client, db_session):
    campaign = _seed_campaign(db_session)
    _seed_metric(db_session, campaign.id)

    resp = client.delete(f"/campaigns/{campaign.id}")
    assert resp.status_code == 204
    assert (
        db_session.scalars(
            select(CampaignMetric).where(CampaignMetric.campaign_id == campaign.id)
        ).all()
        == []
    )


def test_delete_campaign_cascades_consumer_events(client, db_session):
    campaign = _seed_campaign(db_session)
    variant = _seed_variant(db_session, campaign.id)
    variant_id = variant.id
    _seed_consumer_event(db_session, variant_id)

    resp = client.delete(f"/campaigns/{campaign.id}")
    assert resp.status_code == 204
    assert db_session.get(AdVariant, variant_id) is None
    assert (
        db_session.scalars(
            select(ConsumerEvent).where(ConsumerEvent.ad_variant_id == variant_id)
        ).all()
        == []
    )


def test_delete_campaign_not_found(client):
    resp = client.delete("/campaigns/999")
    assert resp.status_code == 404


def test_delete_does_not_affect_other_campaigns(client, db_session):
    camp_a = _seed_campaign(db_session, name="A")
    camp_b = _seed_campaign(db_session, name="B")
    _seed_variant(db_session, camp_a.id)
    _seed_variant(db_session, camp_b.id)
    _seed_chat_message(db_session, camp_a.id)
    _seed_chat_message(db_session, camp_b.id)

    resp = client.delete(f"/campaigns/{camp_a.id}")
    assert resp.status_code == 204

    assert db_session.get(Campaign, camp_a.id) is None
    assert db_session.get(Campaign, camp_b.id) is not None
    assert len(
        db_session.scalars(select(AdVariant).where(AdVariant.campaign_id == camp_b.id)).all()
    ) == 1
    assert len(
        db_session.scalars(
            select(ChatMessage).where(ChatMessage.campaign_id == camp_b.id)
        ).all()
    ) == 1
