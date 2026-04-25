"""SQLAlchemy model for the dbo.consumer_events table."""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import BigInteger, Integer, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class ConsumerEvent(Base):
    __tablename__ = "consumer_events"
    __table_args__ = {"schema": "dbo"}

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    ad_variant_id: Mapped[int] = mapped_column(Integer, nullable=False)
    event_type: Mapped[str] = mapped_column(String, nullable=False)
    consumer_fingerprint: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    platform: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    session_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    referrer: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    meta: Mapped[Optional[str]] = mapped_column("metadata", String, nullable=True)

    def __repr__(self) -> str:
        return f"<ConsumerEvent(id={self.id}, ad_variant_id={self.ad_variant_id}, event_type='{self.event_type}')>"
