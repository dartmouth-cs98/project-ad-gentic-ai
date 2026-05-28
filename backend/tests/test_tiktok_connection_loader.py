"""Tests for the TikTok connection validator + refresh-on-use."""

import json
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest
from cryptography.fernet import Fernet
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost")
# Refresh path encrypts/decrypts the refresh token; need a real Fernet key.
os.environ.setdefault("FERNET_SECRET_KEY", Fernet.generate_key().decode())

from database import Base
from models.social_connection import SocialConnection
from services.ad_platforms._base.encryption import decrypt_token, encrypt_token
from services.ad_platforms.tiktok import connection_loader
from services.ad_platforms.tiktok.connection_loader import (
    ConnectionValidationError,
    load_publish_connection,
)

_CLIENT_ID = 1
_original_schema = SocialConnection.__table__.schema


@pytest.fixture()
def db():
    SocialConnection.__table__.schema = None
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine, tables=[SocialConnection.__table__])
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine, tables=[SocialConnection.__table__])
        SocialConnection.__table__.schema = _original_schema


def _seed(
    db,
    *,
    advertiser_ids=("7644230008365416466",),
    active_advertiser_id="7644230008365416466",
    encrypted_token="enc_access",
    encrypted_refresh="enc_refresh",
    expires_at=None,
    raw_metadata=None,
):
    if expires_at is None:
        expires_at = datetime.now(timezone.utc) + timedelta(hours=12)
    if raw_metadata is None:
        meta = {
            "advertiser_ids": list(advertiser_ids),
            "active_advertiser_id": active_advertiser_id,
        }
        if encrypted_refresh:
            meta["encrypted_refresh_token"] = encrypted_refresh
        raw_metadata = json.dumps(meta)
    db.add(
        SocialConnection(
            business_client_id=_CLIENT_ID,
            platform="tiktok",
            encrypted_token=encrypted_token,
            token_expires_at=expires_at,
            platform_account_id=active_advertiser_id,
            platform_metadata=raw_metadata,
        )
    )
    db.commit()


def test_raises_when_no_connection(db):
    with pytest.raises(ConnectionValidationError, match="not connected"):
        load_publish_connection(db, _CLIENT_ID)


def test_raises_when_metadata_corrupt(db):
    _seed(db, raw_metadata="not-json")
    with pytest.raises(ConnectionValidationError, match="corrupted"):
        load_publish_connection(db, _CLIENT_ID)


@pytest.mark.parametrize("raw_metadata", ["[]", '"oops"', "123", "true", "null"])
def test_raises_when_metadata_is_valid_json_but_not_object(db, raw_metadata):
    _seed(db, raw_metadata=raw_metadata)
    with pytest.raises(ConnectionValidationError, match="corrupted"):
        load_publish_connection(db, _CLIENT_ID)


def test_raises_when_advertiser_ids_missing(db):
    _seed(db, raw_metadata=json.dumps({"foo": "bar"}))
    with pytest.raises(ConnectionValidationError, match="advertiser account"):
        load_publish_connection(db, _CLIENT_ID)


def test_happy_path_returns_validated_connection(db):
    _seed(db)
    result = load_publish_connection(db, _CLIENT_ID)
    assert result.encrypted_token == "enc_access"
    assert result.advertiser_id == "7644230008365416466"
    assert result.advertiser_ids == ("7644230008365416466",)


def test_selects_latest_connection_when_multiple_exist(db):
    old_time = datetime.now(timezone.utc) - timedelta(days=30)
    new_time = datetime.now(timezone.utc) - timedelta(days=1)

    db.add(
        SocialConnection(
            business_client_id=_CLIENT_ID,
            platform="tiktok",
            encrypted_token="old",
            token_expires_at=datetime.now(timezone.utc) + timedelta(hours=12),
            platform_account_id="111",
            platform_metadata=json.dumps({"advertiser_ids": ["111"], "active_advertiser_id": "111"}),
            connected_at=old_time,
        )
    )
    db.add(
        SocialConnection(
            business_client_id=_CLIENT_ID,
            platform="tiktok",
            encrypted_token="new",
            token_expires_at=datetime.now(timezone.utc) + timedelta(hours=12),
            platform_account_id="222",
            platform_metadata=json.dumps({"advertiser_ids": ["222"], "active_advertiser_id": "222"}),
            connected_at=new_time,
        )
    )
    db.commit()

    result = load_publish_connection(db, _CLIENT_ID)
    assert result.encrypted_token == "new"
    assert result.advertiser_id == "222"


def test_refreshes_when_access_token_expired(db, monkeypatch):
    """When the access token is past expiry, the loader calls refresh and persists the new token."""
    real_refresh_token = "rft_real_value"
    enc_refresh = encrypt_token(real_refresh_token)
    _seed(
        db,
        encrypted_token="enc_stale_access",
        encrypted_refresh=enc_refresh,
        expires_at=datetime.now(timezone.utc) - timedelta(hours=1),
    )

    captured_refresh = {}

    def fake_refresh(rt: str) -> dict:
        captured_refresh["rt"] = rt
        return {
            "access_token": "act_brand_new",
            "refresh_token": "rft_brand_new",
            "advertiser_ids": ["7644230008365416466"],
            "access_token_expires_in": 86400,
            "refresh_token_expires_in": 31536000,
        }

    monkeypatch.setattr(connection_loader, "refresh_access_token", fake_refresh)

    result = load_publish_connection(db, _CLIENT_ID)

    # Refresh was called with the decrypted refresh_token.
    assert captured_refresh["rt"] == real_refresh_token

    # The connection now holds a re-encrypted access_token that decrypts to the new one.
    assert decrypt_token(result.encrypted_token) == "act_brand_new"

    # The stored refresh_token has been rotated.
    row = db.query(SocialConnection).filter_by(business_client_id=_CLIENT_ID).one()
    meta = json.loads(row.platform_metadata)
    assert decrypt_token(meta["encrypted_refresh_token"]) == "rft_brand_new"
    # And expiry was pushed forward. SQLite drops tzinfo on load; coerce before compare.
    stored_expiry = row.token_expires_at
    if stored_expiry.tzinfo is None:
        stored_expiry = stored_expiry.replace(tzinfo=timezone.utc)
    assert stored_expiry > datetime.now(timezone.utc) + timedelta(hours=23)


def test_refresh_failure_raises_validation_error(db, monkeypatch):
    enc_refresh = encrypt_token("rft")
    _seed(
        db,
        encrypted_refresh=enc_refresh,
        expires_at=datetime.now(timezone.utc) - timedelta(hours=1),
    )

    def fake_refresh(rt):
        raise RuntimeError("TikTok API error (code=40100)")

    monkeypatch.setattr(connection_loader, "refresh_access_token", fake_refresh)

    with pytest.raises(ConnectionValidationError, match="could not be refreshed"):
        load_publish_connection(db, _CLIENT_ID)


def test_refresh_path_raises_when_no_refresh_token_stored(db):
    """If the connection was somehow saved without a refresh_token, refresh path must fail clearly."""
    _seed(
        db,
        encrypted_refresh=None,
        expires_at=datetime.now(timezone.utc) - timedelta(hours=1),
    )
    with pytest.raises(ConnectionValidationError, match="refresh token is missing"):
        load_publish_connection(db, _CLIENT_ID)
