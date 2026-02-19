"""SQLAlchemy model for the dbo.ad_variants table."""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Integer, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class AdVariant(Base):
    __tablename__ = "ad_variants"
    __table_args__ = {"schema": "dbo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[int] = mapped_column(Integer, nullable=False)
    campaign_id: Mapped[int] = mapped_column(Integer, nullable=False)
    consumer_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=False)
    media_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    meta: Mapped[Optional[str]] = mapped_column("metadata", String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    def __repr__(self) -> str:
        return f"<AdVariant(id={self.id}, campaign_id={self.campaign_id}, status='{self.status}')>"
