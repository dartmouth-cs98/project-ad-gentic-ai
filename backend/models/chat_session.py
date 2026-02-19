"""SQLAlchemy model for the dbo.chat_sessions table."""

from datetime import datetime
from typing import Optional

from sqlalchemy import Integer, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class ChatSession(Base):
    __tablename__ = "chat_sessions"
    __table_args__ = {"schema": "dbo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    campaign_id: Mapped[int] = mapped_column(Integer, nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    context_memory: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_activity_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<ChatSession(id={self.id}, campaign_id={self.campaign_id}, user_id={self.user_id})>"
