"""Pydantic schemas for campaign_metrics."""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel


class CampaignMetricResponse(BaseModel):
    id: int
    campaign_id: int
    meta_campaign_id: Optional[str]
    date: date
    impressions: Optional[int]
    reach: Optional[int]
    clicks: Optional[int]
    spend: Optional[Decimal]
    ctr: Optional[Decimal]
    cpc: Optional[Decimal]
    conversions: Optional[int]
    fetched_at: datetime

    model_config = {"from_attributes": True}


class MetricsSummary(BaseModel):
    """Aggregated totals across the date range, plus per-day rows."""
    total_impressions: int
    total_reach: int
    total_clicks: int
    total_spend: Decimal
    avg_ctr: Optional[Decimal]
    avg_cpc: Optional[Decimal]
    total_conversions: int
    days: list[CampaignMetricResponse]
    last_fetched_at: Optional[datetime]
