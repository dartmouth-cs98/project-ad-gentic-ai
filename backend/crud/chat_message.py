"""CRUD operations for chat_messages table (append-only)."""

from sqlalchemy import select, delete as sa_delete
from sqlalchemy.orm import Session

from models.chat_message import ChatMessage
from schemas.chat_message import ChatMessageCreate


def get_chat_messages(
    db: Session,
    campaign_id: int,
    business_client_id: int,
    skip: int = 0,
    limit: int = 200,
) -> list[ChatMessage]:
    """Return messages for a campaign owned by the given client, oldest-first."""
    query = (
        select(ChatMessage)
        .where(
            ChatMessage.campaign_id == campaign_id,
            ChatMessage.business_client_id == business_client_id,
        )
        .order_by(ChatMessage.timestamp.asc())
        .offset(skip)
        .limit(limit)
    )
    return list(db.scalars(query).all())


def create_chat_message(
    db: Session,
    business_client_id: int,
    data: ChatMessageCreate,
) -> ChatMessage:
    """Insert a new chat message and return it."""
    message = ChatMessage(
        **data.model_dump(),
        business_client_id=business_client_id,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


def delete_chat_messages_by_campaign(
    db: Session,
    campaign_id: int,
    business_client_id: int,
) -> int:
    """Delete all messages for a campaign owned by the given client.

    Returns the number of rows deleted.
    """
    result = db.execute(
        sa_delete(ChatMessage).where(
            ChatMessage.campaign_id == campaign_id,
            ChatMessage.business_client_id == business_client_id,
        )
    )
    db.commit()
    return result.rowcount  # type: ignore[return-value]
