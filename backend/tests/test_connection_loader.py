"""Tests for the Meta social-connection validator used by the /run route."""

import json
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost")

from database import Base
from models.social_connection import SocialConnection
from services.meta.connection_loader import (
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
    metadata: dict | None = {"ad_account_id": "act_1", "facebook_page_id": "page_1"},
    platform_account_id: str | None = "ig_1",
    expires_at: datetime | None = None,
    raw_metadata: str | None = None,
):
    if expires_at is None:
        expires_at = datetime.now(timezone.utc) + timedelta(days=30)
    db.add(
        SocialConnection(
            business_client_id=_CLIENT_ID,
            platform="instagram",
            encrypted_token="enc",
            token_expires_at=expires_at,
            platform_account_id=platform_account_id,
            platform_metadata=raw_metadata if raw_metadata is not None else (json.dumps(metadata) if metadata else None),
        )
    )
    db.commit()


def test_raises_when_no_connection(db):
    with pytest.raises(ConnectionValidationError, match="not connected"):
        load_publish_connection(db, _CLIENT_ID)


def test_raises_when_token_expired(db):
    _seed(db, expires_at=datetime.now(timezone.utc) - timedelta(days=1))
    with pytest.raises(ConnectionValidationError, match="expired"):
        load_publish_connection(db, _CLIENT_ID)


def test_raises_when_metadata_missing_fields(db):
    _seed(db, metadata={"ad_account_id": "act_1"})  # missing page
    with pytest.raises(ConnectionValidationError, match="Facebook page"):
        load_publish_connection(db, _CLIENT_ID)


def test_raises_when_platform_account_id_missing(db):
    _seed(db, platform_account_id=None)
    with pytest.raises(ConnectionValidationError, match="Instagram business account"):
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


def test_happy_path(db):
    _seed(db)
    result = load_publish_connection(db, _CLIENT_ID)
    assert result.encrypted_token == "enc"
    assert result.ad_account_id == "act_1"
    assert result.facebook_page_id == "page_1"
    assert result.instagram_account_id == "ig_1"
