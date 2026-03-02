"""Pydantic schemas for chat_messages — request/response validation."""

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel

# Allowed values (must match the model comments)
ChatRole = Literal["user", "assistant", "system"]
ChatMessageType = Literal["message", "plan", "plan_response"]


# ---------- Request schema ----------

class ChatMessageCreate(BaseModel):
    """Schema for creating a new chat message.

    business_client_id is NOT included here — it is injected from the
    JWT token by the route handler.
    """
    campaign_id: int
    role: ChatRole
    message_type: ChatMessageType = "message"
    content: str
    version_ref: Optional[int] = None


# ---------- Response schema ----------

class ChatMessageResponse(BaseModel):
    """Schema returned to the frontend."""
    id: int
    campaign_id: int
    business_client_id: int
    role: ChatRole
    message_type: ChatMessageType
    content: str
    version_ref: Optional[int] = None
    timestamp: datetime

    model_config = {"from_attributes": True}
