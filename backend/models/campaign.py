"""SQLAlchemy model for the dbo.campaigns table."""

from datetime import datetime, date, timezone
from decimal import Decimal
from typing import Optional

from sqlalchemy import Integer, String, DateTime, Date, Numeric
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class Campaign(Base):
    __tablename__ = "campaigns"
    __table_args__ = {"schema": "dbo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    business_client_id: Mapped[int] = mapped_column(Integer, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False)
    budget_total: Mapped[Optional[Decimal]] = mapped_column(Numeric, nullable=True)
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    goal: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    target_audience: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    product_context: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    brief: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    product_ids: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    meta_campaign_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    def __repr__(self) -> str:
        return f"<Campaign(id={self.id}, name='{self.name}', status='{self.status}')>"
