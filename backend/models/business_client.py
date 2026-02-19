"""SQLAlchemy model for the dbo.business_clients table."""

from datetime import datetime
from typing import Optional

from sqlalchemy import Integer, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class BusinessClient(Base):
    __tablename__ = "business_clients"
    __table_args__ = {"schema": "dbo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String, nullable=False)
    password_hash: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    business_name: Mapped[str] = mapped_column(String, nullable=False)
    subscription_tier: Mapped[str] = mapped_column(String, nullable=False)
    stripe_customer_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    credits_balance: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<BusinessClient(id={self.id}, business_name='{self.business_name}', email='{self.email}')>"
