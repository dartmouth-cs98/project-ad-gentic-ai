"""Campaign metrics endpoint.

GET /campaigns/{campaign_id}/metrics
  — Returns cached daily rows + aggregated totals.
  — Re-fetches from Meta if last pull was > 15 minutes ago AND campaign has
    a meta_campaign_id + the client has a connected social account.
"""

import logging
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.campaign import Campaign
from models.social_connection import SocialConnection
from routes.auth import get_current_client_id
from schemas.campaign_metric import CampaignMetricResponse, MetricsSummary
from services.meta.insights import fetch_and_cache_metrics, is_stale, load_cached_metrics

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/{campaign_id}/metrics", response_model=MetricsSummary)
def get_campaign_metrics(
    campaign_id: int,
    db: Session = Depends(get_db),
    client_id: int = Depends(get_current_client_id),
):
    campaign = db.query(Campaign).filter_by(id=campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if campaign.business_client_id != client_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    meta_campaign_id: Optional[str] = getattr(campaign, "meta_campaign_id", None)

    if meta_campaign_id:
        connection = (
            db.query(SocialConnection)
            .filter_by(business_client_id=client_id, platform="instagram")
            .first()
        )
        if connection:
            # Determine staleness from the most-recently fetched row
            from models.campaign_metric import CampaignMetric
            latest = (
                db.query(CampaignMetric)
                .filter_by(campaign_id=campaign_id)
                .order_by(CampaignMetric.fetched_at.desc())
                .first()
            )
            if is_stale(latest.fetched_at if latest else None):
                try:
                    rows = fetch_and_cache_metrics(
                        db=db,
                        campaign_id=campaign_id,
                        meta_campaign_id=meta_campaign_id,
                        encrypted_token=connection.encrypted_token,
                    )
                except Exception:
                    logger.exception("Failed to refresh metrics for campaign %s", campaign_id)
                    rows = load_cached_metrics(db, campaign_id)
            else:
                rows = load_cached_metrics(db, campaign_id)
        else:
            rows = load_cached_metrics(db, campaign_id)
    else:
        rows = load_cached_metrics(db, campaign_id)

    return _build_summary(campaign_id, rows)


def _build_summary(campaign_id: int, rows: list) -> MetricsSummary:
    total_impressions = sum(r.impressions or 0 for r in rows)
    total_reach = sum(r.reach or 0 for r in rows)
    total_clicks = sum(r.clicks or 0 for r in rows)
    total_spend = sum(r.spend or Decimal(0) for r in rows)
    total_conversions = sum(r.conversions or 0 for r in rows)

    avg_ctr = (
        sum(r.ctr or Decimal(0) for r in rows) / len(rows)
        if rows else None
    )
    avg_cpc = (
        sum(r.cpc or Decimal(0) for r in rows) / len(rows)
        if rows else None
    )

    last_fetched = max((r.fetched_at for r in rows), default=None)

    return MetricsSummary(
        total_impressions=total_impressions,
        total_reach=total_reach,
        total_clicks=total_clicks,
        total_spend=total_spend,
        avg_ctr=avg_ctr,
        avg_cpc=avg_cpc,
        total_conversions=total_conversions,
        days=[CampaignMetricResponse.model_validate(r) for r in rows],
        last_fetched_at=last_fetched,
    )
