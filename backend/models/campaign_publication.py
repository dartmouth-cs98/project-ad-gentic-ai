"""SQLAlchemy model for dbo.campaign_publications.

Tracks each (campaign x ad platform) publication independently so a single
Ad-gentic campaign can be live on multiple platforms (Meta, TikTok, etc.)
without overwriting platform-specific IDs.
"""

from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING

from sqlalchemy import Integer, String, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base

if TYPE_CHECKING:
    from models.campaign import Campaign


class CampaignPublication(Base):
    __tablename__ = "campaign_publications"
    __table_args__ = (
        UniqueConstraint("campaign_id", "external_platform", name="uq_camp_pub"),
        {"schema": "dbo"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    campaign_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("dbo.campaigns.id"), nullable=False
    )
    external_platform: Mapped[str] = mapped_column(String(32), nullable=False)
    external_campaign_id: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    campaign: Mapped["Campaign"] = relationship("Campaign", back_populates="publications")

    def __repr__(self) -> str:
        return (
            f"<CampaignPublication(campaign_id={self.campaign_id}, "
            f"platform='{self.external_platform}', status='{self.status}')>"
        )
