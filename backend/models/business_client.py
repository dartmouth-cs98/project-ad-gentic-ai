"""SQLAlchemy model for the dbo.business_clients table."""

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Integer, String, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class BusinessClient(Base):
    __tablename__ = "business_clients"
    __table_args__ = {"schema": "dbo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    password_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    business_name: Mapped[str] = mapped_column(String(255), nullable=False)
    subscription_tier: Mapped[str] = mapped_column(String(50), nullable=False, default="basic")
    # SQL Server's unique constraint rejects multiple NULLs, so we default
    # to a unique placeholder until a real Stripe customer ID is assigned.
    stripe_customer_id: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True, default=lambda: f"pending_{uuid.uuid4().hex}"
    )
    credits_balance: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    traits: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    email_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    email_verification_token_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    email_verification_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    password_reset_token_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    password_reset_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    auth_provider: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, default="email")

    def __repr__(self) -> str:
        return f"<BusinessClient(id={self.id}, business_name='{self.business_name}', email='{self.email}')>"
