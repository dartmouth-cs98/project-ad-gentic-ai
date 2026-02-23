"""SQLAlchemy model for the dbo.business_clients table."""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Boolean, Integer, String, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class BusinessClient(Base):
    __tablename__ = "business_clients"
    __table_args__ = {"schema": "dbo"}

    # --- Core account fields ---
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    password_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    business_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    subscription_tier: Mapped[str] = mapped_column(String(50), nullable=False, default="basic")
    stripe_customer_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    credits_balance: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    # --- Onboarding Step 1: Company info ---
    industry: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    company_size: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # --- Onboarding Step 2: Product & audience ---
    product_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    target_customer: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # --- Onboarding Step 3: Marketing goals ---
    primary_goal: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    custom_goal: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Stored as JSON arrays, e.g. '["meta","tiktok"]'
    target_platforms: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    target_regions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # --- Onboarding Step 4: Current strategy ---
    ad_spend: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    current_tools: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array
    biggest_challenge: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    other_tools: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # --- Status ---
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    def __repr__(self) -> str:
        return f"<BusinessClient(id={self.id}, business_name='{self.business_name}', email='{self.email}')>"
