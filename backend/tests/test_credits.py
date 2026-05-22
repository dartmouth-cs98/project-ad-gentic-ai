"""Tests for daily credit allowance (services.credits)."""

import sys
from datetime import date, timedelta
from pathlib import Path

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

from database import Base
from models.business_client import BusinessClient
from services.credits import (
    apply_tier_change,
    daily_cap,
    ensure_daily_refresh,
    refund_credits,
    reserve_credits,
    utc_today,
)

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


def _client(tier: str = "basic", balance: int = 10, reset_on: date | None = None) -> BusinessClient:
    return BusinessClient(
        email=f"{tier}@example.com",
        password_hash="x",
        business_name="Test Co",
        subscription_tier=tier,
        credits_balance=balance,
        credits_daily_reset_on=reset_on or utc_today(),
    )


def test_daily_cap_tiers():
    assert daily_cap("basic") == 10
    assert daily_cap("free") == 10
    assert daily_cap("premium") == 100
    assert daily_cap("enterprise") == 100


def test_ensure_daily_refresh_no_rollover():
    db = TestingSessionLocal()
    yesterday = utc_today() - timedelta(days=1)
    c = _client(balance=3, reset_on=yesterday)
    db.add(c)
    db.commit()
    db.refresh(c)

    ensure_daily_refresh(db, c)
    db.refresh(c)
    assert c.credits_balance == 10
    assert c.credits_daily_reset_on == utc_today()
    db.close()


def test_reserve_at_day_rollover_deducts_from_refreshed_cap():
    """Refresh and deduction commit together under the row lock."""
    db = TestingSessionLocal()
    yesterday = utc_today() - timedelta(days=1)
    c = _client(balance=3, reset_on=yesterday)
    db.add(c)
    db.commit()
    db.refresh(c)

    reserve_credits(db, c.id, 4)
    db.refresh(c)
    assert c.credits_balance == 6
    assert c.credits_daily_reset_on == utc_today()
    db.close()


def test_reserve_insufficient_at_day_rollover_does_not_persist_refresh():
    db = TestingSessionLocal()
    yesterday = utc_today() - timedelta(days=1)
    c = _client(balance=3, reset_on=yesterday)
    db.add(c)
    db.commit()
    client_id = c.id
    db.close()

    db = TestingSessionLocal()
    with pytest.raises(HTTPException) as exc_info:
        reserve_credits(db, client_id, 15)
    assert exc_info.value.status_code == 402

    c = db.get(BusinessClient, client_id)
    assert c.credits_balance == 3
    assert c.credits_daily_reset_on == yesterday
    db.close()


def test_reserve_and_refund():
    db = TestingSessionLocal()
    c = _client(balance=10)
    db.add(c)
    db.commit()
    db.refresh(c)

    reserve_credits(db, c.id, 3)
    db.refresh(c)
    assert c.credits_balance == 7

    refund_credits(db, c.id, 2)
    db.refresh(c)
    assert c.credits_balance == 9
    db.close()


def test_apply_tier_change_upgrade_immediate():
    db = TestingSessionLocal()
    c = _client(tier="basic", balance=3)
    db.add(c)
    db.commit()
    db.refresh(c)

    c.subscription_tier = "premium"
    apply_tier_change(db, c)
    db.refresh(c)
    assert c.credits_balance == 100
    db.close()


def test_reserve_insufficient_raises_402():
    db = TestingSessionLocal()
    c = _client(balance=2)
    db.add(c)
    db.commit()
    db.refresh(c)

    with pytest.raises(HTTPException) as exc_info:
        reserve_credits(db, c.id, 5)
    assert exc_info.value.status_code == 402
    detail = exc_info.value.detail
    assert detail["detail"] == "Insufficient credits"
    assert detail["required"] == 5
    assert detail["available"] == 2
    db.close()


def test_refund_does_not_exceed_daily_cap():
    db = TestingSessionLocal()
    c = _client(balance=9)
    db.add(c)
    db.commit()
    db.refresh(c)

    refund_credits(db, c.id, 5)
    db.refresh(c)
    assert c.credits_balance == 10
    db.close()
