"""SQLAlchemy model for the dbo.products table."""

from datetime import datetime
from typing import Optional

from sqlalchemy import Integer, String, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class Product(Base):
    __tablename__ = "products"
    __table_args__ = {"schema": "dbo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    business_client_id: Mapped[int] = mapped_column(Integer, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    product_link: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    metadata: Mapped[Optional[str]] = mapped_column("metadata", String, nullable=True)
    is_active: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True, default=datetime.utcnow)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<Product(id={self.id}, name='{self.name}', business_client_id={self.business_client_id})>"
