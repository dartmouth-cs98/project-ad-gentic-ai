"""Tests for auth verification workflow."""

import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

from database import Base, get_db
from dependencies import get_current_client_id
from main import app
from models.business_client import BusinessClient

_TEST_CLIENT_ID = 1
_original_schema = BusinessClient.__table__.schema

engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
    query_cache_size=0,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_db():
    BusinessClient.__table__.schema = None
    Base.metadata.create_all(bind=engine, tables=[BusinessClient.__table__])
    yield
    Base.metadata.drop_all(bind=engine, tables=[BusinessClient.__table__])
    BusinessClient.__table__.schema = _original_schema


@pytest.fixture()
def client():
    def _override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = _override_get_db
    app.dependency_overrides[get_current_client_id] = lambda: _TEST_CLIENT_ID
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_signup_requires_email_verification_before_signin(client: TestClient):
    with patch("routes.auth.send_verification_email"):
        signup_resp = client.post(
            "/auth/signup",
            json={"email": "verifyme@gmail.com", "password": "Password123!", "plan": "basic"},
        )

    assert signup_resp.status_code == 202
    body = signup_resp.json()
    assert body["success"] is True
    assert "verify your email" in body["message"].lower()

    signin_resp = client.post(
        "/auth/signin",
        json={"email": "verifyme@gmail.com", "password": "Password123!"},
    )
    assert signin_resp.status_code == 403
    assert "not verified" in signin_resp.json()["detail"].lower()


def test_verify_email_enables_signin(client: TestClient):
    captured = {}

    def _capture_verification_email(*, to_email: str, verification_code: str):
        captured["email"] = to_email
        captured["code"] = verification_code

    with patch("routes.auth.send_verification_email", side_effect=_capture_verification_email):
        signup_resp = client.post(
            "/auth/signup",
            json={"email": "verified@gmail.com", "password": "Password123!", "plan": "basic"},
        )

    assert signup_resp.status_code == 202
    assert captured["email"] == "verified@gmail.com"

    verify_resp = client.post(
        "/auth/verify-email",
        json={"email": "verified@gmail.com", "code": captured["code"]},
    )
    assert verify_resp.status_code == 200
    assert verify_resp.json()["success"] is True

    signin_resp = client.post(
        "/auth/signin",
        json={"email": "verified@gmail.com", "password": "Password123!"},
    )
    assert signin_resp.status_code == 200
    assert "access_token" in signin_resp.json()


def test_me_and_onboarding_forbid_unverified_accounts(client: TestClient):
    db = TestingSessionLocal()
    db.add(
        BusinessClient(
            id=_TEST_CLIENT_ID,
            email="pending@gmail.com",
            password_hash="hashed",
            business_name="Pending Inc",
            subscription_tier="basic",
            credits_balance=0,
            email_verified=False,
            email_verification_token_hash="tokenhash",
            email_verification_expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
        )
    )
    db.commit()
    db.close()

    me_resp = client.get("/auth/me")
    assert me_resp.status_code == 403
    assert "verification" in me_resp.json()["detail"].lower()

    onboarding_resp = client.post("/auth/onboarding", json={"company_name": "New Name"})
    assert onboarding_resp.status_code == 403
    assert "verification" in onboarding_resp.json()["detail"].lower()


def test_resend_verification_is_generic_for_unknown_email(client: TestClient):
    resp = client.post("/auth/resend-verification", json={"email": "missing@gmail.com"})
    assert resp.status_code == 200
    assert "if an account exists" in resp.json()["message"].lower()
