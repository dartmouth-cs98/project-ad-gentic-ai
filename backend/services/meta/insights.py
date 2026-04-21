"""Fetches campaign metrics from Meta Insights API and caches them in DB.

Meta returns one row per calendar day (time_increment=1). We upsert each day's
row — overwriting if it exists (Meta updates current-day numbers in real-time)
or inserting if new. Totals are aggregated at read time in MetricsSummary.

Called when the user opens the Analytics tab; re-fetches only if last pull
was more than STALE_THRESHOLD_MINUTES ago.
"""

import logging
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Optional

import httpx
from sqlalchemy.orm import Session

from models.campaign_metric import CampaignMetric
from services.meta.auth import decrypt_token

logger = logging.getLogger(__name__)

META_GRAPH_VERSION = "v21.0"
META_GRAPH_BASE = f"https://graph.facebook.com/{META_GRAPH_VERSION}"

STALE_THRESHOLD_MINUTES = 15


def is_stale(last_fetched_at: Optional[datetime]) -> bool:
    if last_fetched_at is None:
        return True
    age = datetime.now(timezone.utc) - last_fetched_at.replace(tzinfo=timezone.utc)
    return age.total_seconds() > STALE_THRESHOLD_MINUTES * 60


def fetch_and_cache_metrics(
    db: Session,
    campaign_id: int,
    meta_campaign_id: str,
    encrypted_token: str,
) -> list[CampaignMetric]:
    """Pull last-30-day insights from Meta, upsert one row per day, return all rows.

    Each row represents a single calendar day's metrics for this campaign.
    The current day's row is re-written on each fetch (Meta updates it in real-time).
    Historical day rows are also refreshed in case Meta recalculates them.
    """
    token = decrypt_token(encrypted_token)

    resp = httpx.get(
        f"{META_GRAPH_BASE}/{meta_campaign_id}/insights",
        params={
            "access_token": token,
            "fields": "date_start,impressions,reach,clicks,spend,ctr,cpc,actions",
            "date_preset": "last_30d",
            "time_increment": 1,   # one dict per calendar day in the response
            "level": "campaign",
        },
        timeout=20,
    )
    resp.raise_for_status()

    now = datetime.now(timezone.utc)
    for day_row in resp.json().get("data", []):
        # Each day_row is one day's snapshot, e.g.:
        # {"date_start": "2026-04-18", "impressions": 1800, "reach": 1600, ...}
        day = date.fromisoformat(day_row["date_start"])
        conversions = _extract_conversions(day_row.get("actions", []))

        existing = db.query(CampaignMetric).filter_by(campaign_id=campaign_id, date=day).first()
        if existing:
            # Overwrite with latest values — Meta may have updated this day's numbers
            _apply(existing, day_row, conversions, meta_campaign_id, now)
        else:
            metric = CampaignMetric(campaign_id=campaign_id, date=day)
            _apply(metric, day_row, conversions, meta_campaign_id, now)
            db.add(metric)

    db.commit()
    return load_cached_metrics(db, campaign_id)


def load_cached_metrics(db: Session, campaign_id: int) -> list[CampaignMetric]:
    """Return all cached daily rows, ordered oldest-first (for charting)."""
    return (
        db.query(CampaignMetric)
        .filter_by(campaign_id=campaign_id)
        .order_by(CampaignMetric.date)
        .all()
    )


def _apply(
    metric: CampaignMetric,
    row: dict,
    conversions: int,
    meta_campaign_id: str,
    now: datetime,
) -> None:
    """Write one day's Meta API values into a CampaignMetric ORM row."""
    metric.meta_campaign_id = meta_campaign_id
    metric.impressions = int(row.get("impressions") or 0)
    metric.reach = int(row.get("reach") or 0)
    metric.clicks = int(row.get("clicks") or 0)
    metric.spend = Decimal(str(row.get("spend") or "0"))
    metric.ctr = Decimal(str(row.get("ctr") or "0"))
    metric.cpc = Decimal(str(row.get("cpc") or "0"))
    metric.conversions = conversions
    metric.fetched_at = now


def _extract_conversions(actions: list[dict]) -> int:
    for action in actions:
        if action.get("action_type") in ("purchase", "omni_purchase", "offsite_conversion"):
            return int(action.get("value", 0))
    return 0
