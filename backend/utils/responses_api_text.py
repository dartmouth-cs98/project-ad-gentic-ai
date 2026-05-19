"""Extract assistant text from OpenAI-compatible Responses API results (incl. xAI Grok reasoning)."""

from __future__ import annotations


def extract_responses_api_text(response: object) -> str:
    """Return the final assistant text from a Responses API ``response`` object.

    Grok 4.x may return ``output[0]`` as ``type=reasoning`` (no ``content``) and the
    script in a later ``type=message`` item. Older models return a single message first.
    """
    aggregated = getattr(response, "output_text", None)
    if isinstance(aggregated, str) and aggregated.strip():
        return aggregated.strip()

    outputs = getattr(response, "output", None) or []
    message_texts: list[str] = []
    other_texts: list[str] = []

    for item in outputs:
        item_type = getattr(item, "type", None)
        if item_type == "reasoning":
            continue
        parts = _text_parts_from_content(getattr(item, "content", None))
        if not parts:
            continue
        joined = "\n".join(parts)
        if item_type == "message":
            message_texts.append(joined)
        else:
            other_texts.append(joined)

    if message_texts:
        return message_texts[-1]
    if other_texts:
        return other_texts[-1]
    return ""


def _text_parts_from_content(content: object | None) -> list[str]:
    if not content:
        return []
    parts: list[str] = []
    for block in content:
        text = getattr(block, "text", None)
        if isinstance(text, str) and text.strip():
            parts.append(text.strip())
    return parts
