"""Tests for PATCH /campaigns/{id}/draft-generation-preferences."""

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost")
os.environ.setdefault("JWT_SECRET", "test-secret")

from database import Base, get_db
from dependencies import get_current_client_id
from main import app
from models.campaign import Campaign
from models.campaign_publication import CampaignPublication

_ORIGINAL_SCHEMAS = {
    Campaign: Campaign.__table__.schema,
    CampaignPublication: CampaignPublication.__table__.schema,
}
_CLIENT_ID = 42
_OTHER_CLIENT_ID = 999

_VALID_PREFS = {
    "personalization_range": "group",
    "variants_per_group": 4,
    "ad_formats": ["images", "videos"],
    "tone": "bold",
    "budget_tier": "mid",
    "cta_style": "direct",
    "language": "English (US)",
    "platforms": ["Facebook Feed", "Instagram Story"],
    "color_mode": "brand",
}


_TEST_MODELS = (Campaign, CampaignPublication)


@pytest.fixture()
def db_session():
    for model in _TEST_MODELS:
        model.__table__.schema = None
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine, tables=[m.__table__ for m in _TEST_MODELS])
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine, tables=[m.__table__ for m in _TEST_MODELS])
        for model in _TEST_MODELS:
            model.__table__.schema = _ORIGINAL_SCHEMAS[model]


@pytest.fixture()
def client(db_session):
    def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    app.dependency_overrides[get_current_client_id] = lambda: _CLIENT_ID
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture()
def client_no_auth(db_session):
    def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    app.dependency_overrides.pop(get_current_client_id, None)
    yield TestClient(app)
    app.dependency_overrides.clear()


def _seed_campaign(
    db_session,
    *,
    name: str = "Prefs Campaign",
    business_client_id: int = _CLIENT_ID,
) -> Campaign:
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


def test_patch_draft_preferences_success(client, db_session):
    campaign = _seed_campaign(db_session)

    res = client.patch(
        f"/campaigns/{campaign.id}/draft-generation-preferences",
        json=_VALID_PREFS,
    )

    assert res.status_code == 200
    body = res.json()
    assert body["draft_generation_preferences"]["tone"] == "bold"
    assert body["draft_generation_preferences"]["variants_per_group"] == 4

    db_session.refresh(campaign)
    stored = json.loads(campaign.draft_generation_preferences)
    assert stored["tone"] == "bold"


def test_get_campaign_returns_parsed_draft(client, db_session):
    campaign = _seed_campaign(db_session)
    client.patch(
        f"/campaigns/{campaign.id}/draft-generation-preferences",
        json=_VALID_PREFS,
    )

    res = client.get(f"/campaigns/{campaign.id}")
    assert res.status_code == 200
    assert res.json()["draft_generation_preferences"]["cta_style"] == "direct"


def test_patch_draft_preferences_forbidden_other_client(client, db_session):
    campaign = _seed_campaign(db_session, business_client_id=_OTHER_CLIENT_ID)

    res = client.patch(
        f"/campaigns/{campaign.id}/draft-generation-preferences",
        json=_VALID_PREFS,
    )

    assert res.status_code == 403


def test_patch_draft_preferences_not_found(client):
    res = client.patch(
        "/campaigns/99999/draft-generation-preferences",
        json=_VALID_PREFS,
    )
    assert res.status_code == 404


def test_patch_draft_preferences_unauthorized(client_no_auth, db_session):
    campaign = _seed_campaign(db_session)

    res = client_no_auth.patch(
        f"/campaigns/{campaign.id}/draft-generation-preferences",
        json=_VALID_PREFS,
    )

    assert res.status_code in (401, 403)


def test_patch_draft_preferences_invalid_variants(client, db_session):
    campaign = _seed_campaign(db_session)
    bad = {**_VALID_PREFS, "variants_per_group": 99}

    res = client.patch(
        f"/campaigns/{campaign.id}/draft-generation-preferences",
        json=bad,
    )

    assert res.status_code == 422


def test_put_campaign_with_draft_preferences(client, db_session):
    campaign = _seed_campaign(db_session)

    res = client.put(
        f"/campaigns/{campaign.id}",
        json={"draft_generation_preferences": _VALID_PREFS},
    )

    assert res.status_code == 200
    assert res.json()["draft_generation_preferences"]["tone"] == "bold"

    db_session.refresh(campaign)
    assert campaign.draft_generation_preferences is not None
