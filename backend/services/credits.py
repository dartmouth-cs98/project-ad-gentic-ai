"""Daily credit allowance: tier caps, UTC refresh, reserve/refund for ad generation."""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from models.business_client import BusinessClient

logger = logging.getLogger(__name__)

FREE_TIER_CAP = 10
SUBSCRIPTION_TIER_CAP = 100

FREE_TIERS = frozenset({"basic", "free"})
SUBSCRIPTION_TIERS = frozenset({"premium", "enterprise"})


def credits_enforce_enabled() -> bool:
    return os.getenv("CREDITS_ENFORCE", "true").strip().lower() not in (
        "0",
        "false",
        "no",
        "off",
    )


def daily_cap(subscription_tier: str) -> int:
    tier = (subscription_tier or "basic").strip().lower()
    if tier in SUBSCRIPTION_TIERS:
        return SUBSCRIPTION_TIER_CAP
    if tier in FREE_TIERS:
        return FREE_TIER_CAP
    logger.warning("Unknown subscription_tier %r — using free daily cap %s", subscription_tier, FREE_TIER_CAP)
    return FREE_TIER_CAP


def utc_today() -> date:
    return datetime.now(timezone.utc).date()


@dataclass(frozen=True)
class SpendableCredits:
    remaining: int
    daily_cap: int
    subscription_tier: str
    credits_daily_reset_on: date


def _coerce_reset_date(value: date | datetime | None) -> date | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date()
    return value


def ensure_daily_refresh(db: Session, client: BusinessClient) -> BusinessClient:
    """If UTC calendar day advanced, set balance to tier cap (no rollover)."""
    today = utc_today()
    reset_on = _coerce_reset_date(getattr(client, "credits_daily_reset_on", None))
    if reset_on is None or reset_on < today:
        cap = daily_cap(client.subscription_tier)
        client.credits_balance = cap
        client.credits_daily_reset_on = today
        db.commit()
        db.refresh(client)
    return client


def apply_tier_change(db: Session, client: BusinessClient) -> BusinessClient:
    """After subscription_tier update: grant full new cap immediately."""
    client.credits_balance = daily_cap(client.subscription_tier)
    if getattr(client, "credits_daily_reset_on", None) is None:
        client.credits_daily_reset_on = utc_today()
    db.commit()
    db.refresh(client)
    return client


def get_spendable_credits(db: Session, client: BusinessClient) -> SpendableCredits:
    client = ensure_daily_refresh(db, client)
    cap = daily_cap(client.subscription_tier)
    return SpendableCredits(
        remaining=client.credits_balance,
        daily_cap=cap,
        subscription_tier=client.subscription_tier,
        credits_daily_reset_on=_coerce_reset_date(client.credits_daily_reset_on) or utc_today(),
    )


def next_utc_reset_at(reset_on: date) -> datetime:
    """Start of the next UTC day after ``reset_on`` (for profile display)."""
    next_day = reset_on + timedelta(days=1)
    return datetime(next_day.year, next_day.month, next_day.day, tzinfo=timezone.utc)


def _lock_client(db: Session, client_id: int) -> BusinessClient | None:
    stmt = select(BusinessClient).where(BusinessClient.id == client_id).with_for_update()
    return db.scalars(stmt).first()


def reserve_credits(db: Session, client_id: int, amount: int) -> BusinessClient:
    """Deduct ``amount`` from today's balance. Raises HTTP 402 if insufficient."""
    if amount <= 0:
        client = db.get(BusinessClient, client_id)
        if client is None:
            raise HTTPException(status_code=404, detail="Business client not found.")
        return ensure_daily_refresh(db, client)

    if not credits_enforce_enabled():
        client = db.get(BusinessClient, client_id)
        if client is None:
            raise HTTPException(status_code=404, detail="Business client not found.")
        return ensure_daily_refresh(db, client)

    client = _lock_client(db, client_id)
    if client is None:
        raise HTTPException(status_code=404, detail="Business client not found.")
    ensure_daily_refresh(db, client)
    cap = daily_cap(client.subscription_tier)
    if client.credits_balance < amount:
        raise HTTPException(
            status_code=402,
            detail={
                "detail": "Insufficient credits",
                "required": amount,
                "available": client.credits_balance,
                "daily_cap": cap,
            },
        )
    client.credits_balance -= amount
    db.commit()
    db.refresh(client)
    return client


def refund_credits(db: Session, client_id: int, amount: int) -> BusinessClient | None:
    """Return credits after a failed job (cap at daily_cap)."""
    if amount <= 0 or not credits_enforce_enabled():
        return db.get(BusinessClient, client_id)

    client = _lock_client(db, client_id)
    if client is None:
        return None
    ensure_daily_refresh(db, client)
    cap = daily_cap(client.subscription_tier)
    client.credits_balance = min(cap, client.credits_balance + amount)
    db.commit()
    db.refresh(client)
    return client


def credit_fields_for_client(db: Session, client: BusinessClient) -> dict:
    spendable = get_spendable_credits(db, client)
    reset_on = spendable.credits_daily_reset_on
    return {
        "credits_balance": spendable.remaining,
        "credits_daily_cap": spendable.daily_cap,
        "credits_daily_reset_on": reset_on.isoformat(),
        "credits_next_reset_at": next_utc_reset_at(reset_on).isoformat(),
    }
