"""SQLAlchemy model for dbo.campaign_metrics — cached daily metrics per campaign."""

from datetime import datetime, date as date_type, timezone
from decimal import Decimal
from typing import Optional

from sqlalchemy import Integer, String, Date, DateTime, Numeric
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class CampaignMetric(Base):
    __tablename__ = "campaign_metrics"
    __table_args__ = {"schema": "dbo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    campaign_id: Mapped[int] = mapped_column(Integer, nullable=False)
    meta_campaign_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    date: Mapped[date_type] = mapped_column(Date, nullable=False)
    impressions: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    reach: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    clicks: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    spend: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    ctr: Mapped[Optional[Decimal]] = mapped_column(Numeric(8, 4), nullable=True)
    cpc: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    conversions: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    fetched_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )
