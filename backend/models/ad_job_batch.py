"""SQLAlchemy model for the dbo.ad_job_batches table."""

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class AdJobBatch(Base):
    __tablename__ = "ad_job_batches"
    __table_args__ = {"schema": "dbo"}

    id: Mapped[uuid.UUID] = mapped_column(
        UNIQUEIDENTIFIER(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UNIQUEIDENTIFIER(as_uuid=True),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    total_jobs: Mapped[int] = mapped_column(Integer, nullable=False)
    succeeded_jobs: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    failed_jobs: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    idempotency_key: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    canceled_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    def __repr__(self) -> str:
        return f"<AdJobBatch(id={self.id}, user_id={self.user_id}, status='{self.status}')>"
