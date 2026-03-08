"""Chat AI service — sends conversation to Grok and returns the assistant response."""

import os
import re
import json

from openai import AsyncOpenAI
from dotenv import load_dotenv

from .prompts import build_messages_for_completion

load_dotenv()


def _get_chat_client() -> AsyncOpenAI:
    """Return an AsyncOpenAI client configured for the xAI/Grok API."""
    api_key = os.getenv("SCRIPT_API_KEY", "").strip()
    base_url = os.getenv("SCRIPT_BASE_URL", "").strip()
    if not api_key or not base_url:
        raise ValueError("SCRIPT_API_KEY and SCRIPT_BASE_URL must be set.")
    return AsyncOpenAI(api_key=api_key, base_url=base_url)


def detect_plan_in_response(content: str) -> str | None:
    """Extract JSON plan from a ```json ... ``` block if present.

    Returns the parsed JSON string (re-serialized for consistency) or None.
    """
    match = re.search(r"```json\s*(\{[\s\S]*?\})\s*```", content)
    if not match:
        return None
    try:
        parsed = json.loads(match.group(1))
        return json.dumps(parsed)
    except json.JSONDecodeError:
        return None


async def get_chat_completion(
    conversation_history: list[dict],
    filter_context: dict | None = None,
    campaign_context: dict | None = None,
    previous_plan: str | None = None,
) -> dict:
    """Call the Grok API with conversation history and return the response.

    Returns a dict with:
        - content: the full text response from the AI
        - message_type: 'plan' if a JSON plan was detected, else 'message'
        - plan_json: the extracted plan JSON string (only if message_type == 'plan')
    """
    client = _get_chat_client()
    model = os.getenv("SCRIPT_MODEL", "grok-4").strip()

    messages = build_messages_for_completion(
        conversation_history=conversation_history,
        filter_context=filter_context,
        campaign_context=campaign_context,
        previous_plan=previous_plan,
    )

    response = await client.chat.completions.create(
        model=model,
        messages=messages,
        max_tokens=2000,
        temperature=0.7,
    )

    content = response.choices[0].message.content or ""

    # Check if the response contains a plan
    plan_json = detect_plan_in_response(content)

    return {
        "content": content,
        "message_type": "plan" if plan_json else "message",
        "plan_json": plan_json,
    }
