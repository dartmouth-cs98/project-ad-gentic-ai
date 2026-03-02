"""API routes for chat_messages — append-only endpoints (JWT-protected)."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_client_id
from schemas.chat_message import ChatMessageCreate, ChatMessageResponse
from crud.chat_message import (
    get_chat_messages,
    create_chat_message,
    delete_chat_messages_by_campaign,
)

router = APIRouter()


@router.get("/", response_model=list[ChatMessageResponse])
def list_chat_messages(
    campaign_id: int = Query(..., description="Campaign to fetch messages for"),
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
    client_id: int = Depends(get_current_client_id),
):
    """Get all chat messages for a campaign (oldest-first)."""
    return get_chat_messages(
        db,
        campaign_id=campaign_id,
        business_client_id=client_id,
        skip=skip,
        limit=limit,
    )


@router.post("/", response_model=ChatMessageResponse, status_code=201)
def create_new_chat_message(
    data: ChatMessageCreate,
    db: Session = Depends(get_db),
    client_id: int = Depends(get_current_client_id),
):
    """Create a new chat message."""
    return create_chat_message(db, business_client_id=client_id, data=data)


@router.delete("/", status_code=204)
def clear_chat_messages(
    campaign_id: int = Query(..., description="Campaign whose messages to delete"),
    db: Session = Depends(get_db),
    client_id: int = Depends(get_current_client_id),
):
    """Delete all chat messages for a campaign (reset conversation)."""
    deleted = delete_chat_messages_by_campaign(
        db, campaign_id=campaign_id, business_client_id=client_id,
    )
    if deleted == 0:
        raise HTTPException(
            status_code=404,
            detail="No messages found for this campaign.",
        )
