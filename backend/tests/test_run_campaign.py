"""Integration tests for PATCH /campaigns/{id}/run — Meta publish wiring."""

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

from database import Base, get_db
from dependencies import get_current_client_id
from main import app
from models.campaign import Campaign
from services.meta.campaign_publisher import MetaPublishError
from services.meta.connection_loader import (
    ConnectionValidationError,
    ValidatedMetaConnection,
)

_CLIENT_ID = 1
_OTHER_CLIENT_ID = 999
_original_schema = Campaign.__table__.schema

_VALID_CONNECTION = ValidatedMetaConnection(
    encrypted_token="enc-token",
    ad_account_id="act_123",
    facebook_page_id="page_1",
    instagram_account_id="ig_1",
)


@pytest.fixture()
def db_session():
    Campaign.__table__.schema = None
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine, tables=[Campaign.__table__])
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine, tables=[Campaign.__table__])
        Campaign.__table__.schema = _original_schema


@pytest.fixture()
def client(db_session):
    def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    app.dependency_overrides[get_current_client_id] = lambda: _CLIENT_ID
    yield TestClient(app)
    app.dependency_overrides.clear()


def _seed_campaign(
    db_session,
    *,
    status: str = "draft",
    meta_campaign_id: str | None = None,
    business_client_id: int = _CLIENT_ID,
) -> Campaign:
    now = datetime.now(timezone.utc)
    campaign = Campaign(
        business_client_id=business_client_id,
        name="Spring Launch",
        status=status,
        meta_campaign_id=meta_campaign_id,
        created_at=now,
        updated_at=now,
    )
    db_session.add(campaign)
    db_session.commit()
    db_session.refresh(campaign)
    return campaign


def _patch_helpers(
    monkeypatch,
    *,
    connection=_VALID_CONNECTION,
    connection_error: Exception | None = None,
    persona_groups=None,
    publish_result: str | None = "meta_new_123",
    publish_error: Exception | None = None,
):
    def _load_conn(_db, _client_id):
        if connection_error:
            raise connection_error
        return connection

    def _group(_db, _campaign_id):
        return persona_groups if persona_groups is not None else [
            {"persona_name": "Busy Parent", "persona_traits": {}, "variants": [{"id": 1, "media_url": "x", "script": "s"}]}
        ]

    def _publish(**kwargs):
        if publish_error:
            raise publish_error
        return publish_result

    monkeypatch.setattr("routes.campaigns.load_publish_connection", _load_conn)
    monkeypatch.setattr("routes.campaigns.group_approved_variants_by_persona", _group)
    monkeypatch.setattr("routes.campaigns.publish_campaign", _publish)


def test_run_publishes_and_activates(client, db_session, monkeypatch):
    campaign = _seed_campaign(db_session)
    _patch_helpers(monkeypatch, publish_result="meta_new_999")

    resp = client.patch(f"/campaigns/{campaign.id}/run")

    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "active"
    assert body["meta_campaign_id"] == "meta_new_999"

    db_session.refresh(campaign)
    assert campaign.status == "active"
    assert campaign.meta_campaign_id == "meta_new_999"


def test_run_is_idempotent_when_already_active(client, db_session, monkeypatch):
    campaign = _seed_campaign(db_session, status="active", meta_campaign_id="meta_existing")

    called = {"publish": False}

    def _publish(**_kwargs):
        called["publish"] = True
        return "should-not-happen"

    monkeypatch.setattr("routes.campaigns.publish_campaign", _publish)

    resp = client.patch(f"/campaigns/{campaign.id}/run")
    assert resp.status_code == 200
    assert resp.json()["status"] == "active"
    assert called["publish"] is False


def test_run_returns_403_for_other_clients_campaign(client, db_session, monkeypatch):
    campaign = _seed_campaign(db_session, business_client_id=_OTHER_CLIENT_ID)
    _patch_helpers(monkeypatch)

    resp = client.patch(f"/campaigns/{campaign.id}/run")
    assert resp.status_code == 403


def test_run_returns_404_for_missing_campaign(client, monkeypatch):
    _patch_helpers(monkeypatch)
    resp = client.patch("/campaigns/424242/run")
    assert resp.status_code == 404


def test_run_returns_400_when_connection_missing(client, db_session, monkeypatch):
    campaign = _seed_campaign(db_session)
    _patch_helpers(
        monkeypatch,
        connection_error=ConnectionValidationError("Instagram is not connected."),
    )

    resp = client.patch(f"/campaigns/{campaign.id}/run")
    assert resp.status_code == 400
    assert "Instagram" in resp.json()["detail"]

    db_session.refresh(campaign)
    assert campaign.status == "draft"


def test_run_returns_400_when_no_approved_variants(client, db_session, monkeypatch):
    campaign = _seed_campaign(db_session)
    _patch_helpers(monkeypatch, persona_groups=[])

    resp = client.patch(f"/campaigns/{campaign.id}/run")
    assert resp.status_code == 400
    assert "approved" in resp.json()["detail"].lower()


def test_run_persists_partial_meta_campaign_id_on_failure(client, db_session, monkeypatch):
    campaign = _seed_campaign(db_session)
    _patch_helpers(
        monkeypatch,
        publish_error=MetaPublishError(
            "Ad set creation failed for 'Busy Parent'", meta_campaign_id="meta_partial_abc"
        ),
    )

    resp = client.patch(f"/campaigns/{campaign.id}/run")
    assert resp.status_code == 502

    db_session.refresh(campaign)
    assert campaign.meta_campaign_id == "meta_partial_abc"
    assert campaign.status == "draft"


def test_run_does_not_overwrite_existing_meta_campaign_id_on_failure(client, db_session, monkeypatch):
    campaign = _seed_campaign(db_session, meta_campaign_id="meta_prior_xyz")
    _patch_helpers(
        monkeypatch,
        publish_error=MetaPublishError(
            "Resume failed", meta_campaign_id="meta_prior_xyz"
        ),
    )

    resp = client.patch(f"/campaigns/{campaign.id}/run")
    assert resp.status_code == 502

    db_session.refresh(campaign)
    assert campaign.meta_campaign_id == "meta_prior_xyz"
    assert campaign.status == "draft"


def test_run_resumes_from_existing_meta_campaign_id(client, db_session, monkeypatch):
    """When meta_campaign_id is already set, it should be passed to publish_campaign."""
    campaign = _seed_campaign(db_session, meta_campaign_id="meta_resume_me")
    captured = {}

    def _publish(**kwargs):
        captured.update(kwargs)
        return "meta_resume_me"

    monkeypatch.setattr("routes.campaigns.load_publish_connection", lambda _d, _c: _VALID_CONNECTION)
    monkeypatch.setattr(
        "routes.campaigns.group_approved_variants_by_persona",
        lambda _d, _cid: [{"persona_name": "X", "persona_traits": {}, "variants": [{"id": 1, "media_url": "x", "script": ""}]}],
    )
    monkeypatch.setattr("routes.campaigns.publish_campaign", _publish)

    resp = client.patch(f"/campaigns/{campaign.id}/run")
    assert resp.status_code == 200
    assert captured["existing_meta_campaign_id"] == "meta_resume_me"
