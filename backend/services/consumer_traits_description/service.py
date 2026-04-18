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


def _script_compatible_client() -> tuple[AsyncOpenAI, str]:
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


async def generate_consumer_traits_description(
    traits: dict,
    *,
    model: str | None = None,
) -> str:
    """Return a narrative summary for ``traits`` using the script LLM (Grok / ``SCRIPT_*``).

    Empty ``traits`` → empty string (no API call).
    """
    if not traits:
        return ""
    client, default_model = _script_compatible_client()
    resolved_model = (model or default_model).strip()
    try:
        response = await client.chat.completions.create(
            model=resolved_model,
            messages=[
                {"role": "system", "content": _SYSTEM},
                {
                    "role": "user",
                    "content": (
                        "Turn this JSON object into a short audience description "
                        "(third person, for a creative director). Traits JSON:\n"
                        + json.dumps(traits, indent=2)
                    ),
                },
            ],
            max_tokens=300,
            temperature=0.4,
        )
        text = (response.choices[0].message.content or "").strip()
        return text
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
