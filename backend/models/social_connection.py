"""SQLAlchemy model for dbo.social_connections."""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Integer, String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class SocialConnection(Base):
    __tablename__ = "social_connections"
    __table_args__ = {"schema": "dbo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    business_client_id: Mapped[int] = mapped_column(Integer, nullable=False)
    platform: Mapped[str] = mapped_column(String(30), nullable=False, default="instagram")
    encrypted_token: Mapped[str] = mapped_column(Text, nullable=False)
    token_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    # Generic account identifier — IG business account ID, TikTok advertiser ID, etc.
    platform_account_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    # JSON blob for platform-specific extras: {"ad_account_id": "act_...", "page_id": "..."}
    platform_metadata: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    connected_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )
