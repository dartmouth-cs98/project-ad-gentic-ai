"""Build and resolve natural-language consumer copy for script generation."""

from __future__ import annotations

import json
import logging
import os
from typing import Any

from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

_SYSTEM = """You turn structured consumer trait data into a short third-person audience blurb for an ad creative.
Rules:
- Output 1–3 sentences only. Plain prose, no bullet lists, no JSON, no field names from the input.
- Do not include email addresses, phone numbers, or street addresses.
- If the input is empty or has almost no usable signals, output a single short sentence that the audience is underspecified.
"""


def get_script_llm_client_and_model() -> tuple[AsyncOpenAI, str]:
    """Same Grok / OpenAI-compatible stack as ``generate_ad_script`` (``SCRIPT_*`` env)."""
    api_key = os.getenv("SCRIPT_API_KEY", "").strip()
    model = os.getenv("SCRIPT_MODEL", "").strip()
    base_url = os.getenv("SCRIPT_BASE_URL", "").strip()
    if not api_key or not base_url:
        raise ValueError(
            "SCRIPT_API_KEY and SCRIPT_BASE_URL must be set to generate consumer_traits_description "
            "(same configuration as ad script generation)."
        )
    if not model:
        raise ValueError("SCRIPT_MODEL must be set to generate consumer_traits_description.")
    return AsyncOpenAI(api_key=api_key, base_url=base_url), model


def _message_text_from_completion_response(response: Any) -> str:
    """Best-effort extract assistant text; raises ValueError if the response shape is unusable."""
    choices = getattr(response, "choices", None)
    if not choices:
        raise ValueError("LLM returned no choices for consumer_traits_description")
    first = choices[0]
    message = getattr(first, "message", None)
    raw = getattr(message, "content", None) if message is not None else None
    if raw is None:
        return ""
    if isinstance(raw, str):
        return raw.strip()
    # Some providers return a list of content parts
    if isinstance(raw, list):
        parts: list[str] = []
        for part in raw:
            if isinstance(part, str):
                parts.append(part)
            elif isinstance(part, dict) and part.get("type") == "text":
                parts.append(str(part.get("text", "")))
        return "".join(parts).strip()
    return str(raw).strip()


async def _generate_with_client(
    client: AsyncOpenAI,
    resolved_model: str,
    traits: dict,
) -> str:
    traits_json = json.dumps(traits, indent=2, default=str)
    response = await client.chat.completions.create(
        model=resolved_model,
        messages=[
            {"role": "system", "content": _SYSTEM},
            {
                "role": "user",
                "content": (
                    "Turn this JSON object into a short audience description "
                    "(third person, for a creative director). Traits JSON:\n"
                    + traits_json
                ),
            },
        ],
        max_tokens=300,
        temperature=0.4,
    )
    return _message_text_from_completion_response(response)


async def generate_consumer_traits_description(
    traits: dict,
    *,
    model: str | None = None,
    _client_and_model: tuple[AsyncOpenAI, str] | None = None,
) -> str:
    """Return a narrative summary for ``traits`` using the script LLM (Grok / ``SCRIPT_*``).

    Empty ``traits`` → empty string (no API call).

    Pass ``_client_and_model`` from :func:`get_script_llm_client_and_model` to reuse one client
    for multiple calls (e.g. CSV import).
    """
    if not traits:
        return ""
    if _client_and_model is not None:
        client, default_model = _client_and_model
    else:
        client, default_model = get_script_llm_client_and_model()
    resolved_model = (model or default_model).strip()
    try:
        return await _generate_with_client(client, resolved_model, traits)
    except Exception as exc:
        logger.error("consumer_traits_description LLM failed: %s", exc)
        raise


def legacy_traits_prompt_lines(traits: dict) -> str:
    """Previous script prompt format: one ``key: value`` line per trait."""
    if not traits:
        return ""
    return "\n".join(f"{k}: {v}" for k, v in traits.items())


def consumer_profile_text_for_script(consumer: Any) -> str:
    """Prefer ``consumer_traits_description``; otherwise build lines from ``traits`` JSON."""
    raw_desc = getattr(consumer, "consumer_traits_description", None)
    if isinstance(raw_desc, str) and raw_desc.strip():
        return raw_desc.strip()
    traits_raw = getattr(consumer, "traits", None)
    try:
        traits_dict = json.loads(traits_raw) if traits_raw else {}
    except (json.JSONDecodeError, TypeError):
        logger.warning(
            "Invalid traits JSON for consumer id=%s",
            getattr(consumer, "id", "?"),
        )
        traits_dict = {}
    return legacy_traits_prompt_lines(traits_dict)
