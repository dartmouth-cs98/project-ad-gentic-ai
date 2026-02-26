"""SQLAlchemy model for the dbo.chat_messages table."""

from datetime import datetime, timezone

from sqlalchemy import Integer, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    __table_args__ = {"schema": "dbo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    campaign_id: Mapped[int] = mapped_column(Integer, nullable=False)
    business_client_id: Mapped[int] = mapped_column(Integer, nullable=False)
    role: Mapped[str] = mapped_column(String, nullable=False)             # 'user' | 'assistant' | 'system'
    message_type: Mapped[str] = mapped_column(String, nullable=False, default="message")  # 'message' | 'plan' | 'plan_response'
    content: Mapped[str] = mapped_column(String, nullable=False)
    version_ref: Mapped[int | None] = mapped_column(Integer, nullable=True)  # links plan/approval to a generation version
    timestamp: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    def __repr__(self) -> str:
        return f"<ChatMessage(id={self.id}, campaign_id={self.campaign_id}, role='{self.role}')>"
