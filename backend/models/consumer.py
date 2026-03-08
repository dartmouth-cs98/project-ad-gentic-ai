"""SQLAlchemy model for the dbo.consumers table."""

from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Consumer(Base):
    __tablename__ = "consumers"
    __table_args__ = (
        UniqueConstraint("business_client_id", "email", name="UQ_Consumers_Client_Email"),
        {"schema": "dbo"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    business_client_id: Mapped[int] = mapped_column(Integer, ForeignKey("dbo.business_clients.id"), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    first_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    last_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    traits: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Persona assignment fields
    primary_persona_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("dbo.personas.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    secondary_persona_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("dbo.personas.id", ondelete="SET NULL"),
        nullable=True,
    )
    persona_confidence: Mapped[Optional[Decimal]] = mapped_column(Numeric(3, 2), nullable=True)
    persona_assigned_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relationships
    primary_persona: Mapped[Optional["Persona"]] = relationship(
        "Persona", foreign_keys=[primary_persona_id]
    )
    secondary_persona: Mapped[Optional["Persona"]] = relationship(
        "Persona", foreign_keys=[secondary_persona_id]
    )

    def __repr__(self) -> str:
        return f"<Consumer(id={self.id}, email='{self.email}', first_name='{self.first_name}')>"
