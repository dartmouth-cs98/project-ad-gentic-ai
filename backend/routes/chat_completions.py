"""API route for AI-powered chat completions (JWT-protected).

Flow:
1. Frontend sends user message + campaign_id + optional filter context
2. Backend persists the user message
3. Backend sends conversation history to Grok
4. Backend persists the AI response
5. Returns the AI response to the frontend
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_client_id
from crud.chat_message import get_chat_messages, create_chat_message
from schemas.chat_message import ChatMessageCreate, ChatMessageResponse
from services.chat_ai.service import get_chat_completion

router = APIRouter()


# ---------- Request / Response schemas ----------

class ChatCompletionRequest(BaseModel):
    """Request body for the chat completion endpoint."""
    campaign_id: int
    message: str
    filter_context: Optional[dict] = None
    campaign_context: Optional[dict] = None
    previous_plan: Optional[str] = None


class ChatCompletionResponse(BaseModel):
    """Response body — the persisted user message + AI response."""
    user_message: ChatMessageResponse
    assistant_message: ChatMessageResponse
    message_type: str  # 'message' or 'plan'
    plan_json: Optional[str] = None


# ---------- Endpoint ----------

@router.post("/", response_model=ChatCompletionResponse)
async def chat_completion(
    body: ChatCompletionRequest,
    db: Session = Depends(get_db),
    client_id: int = Depends(get_current_client_id),
):
    """Send a message and get an AI response.

    Persists both the user message and the AI response as chat messages.
    """
    # 1. Persist the user message
    user_msg = create_chat_message(
        db,
        business_client_id=client_id,
        data=ChatMessageCreate(
            campaign_id=body.campaign_id,
            role="user",
            message_type="message",
            content=body.message,
        ),
    )

    # 2. Fetch conversation history for this campaign
    history = get_chat_messages(
        db,
        campaign_id=body.campaign_id,
        business_client_id=client_id,
    )

    # Convert to dicts for the AI service
    history_dicts = [
        {"role": msg.role, "content": msg.content, "message_type": msg.message_type}
        for msg in history
    ]

    # 3. Call the AI
    try:
        ai_result = await get_chat_completion(
            conversation_history=history_dicts,
            filter_context=body.filter_context,
            campaign_context=body.campaign_context,
            previous_plan=body.previous_plan,
        )
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"AI service error: {str(e)}",
        )

    # 4. Persist the AI response
    assistant_msg = create_chat_message(
        db,
        business_client_id=client_id,
        data=ChatMessageCreate(
            campaign_id=body.campaign_id,
            role="assistant",
            message_type=ai_result["message_type"],
            content=ai_result["content"],
        ),
    )

    return ChatCompletionResponse(
        user_message=ChatMessageResponse.model_validate(user_msg),
        assistant_message=ChatMessageResponse.model_validate(assistant_msg),
        message_type=ai_result["message_type"],
        plan_json=ai_result.get("plan_json"),
    )
