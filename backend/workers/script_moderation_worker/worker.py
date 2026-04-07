from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass

from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv()


_MODERATION_INSTRUCTIONS = """You are a brand-safety and content policy reviewer for short-form video ad scripts.
Evaluate the script for: violence or self-harm glorification; hate or harassment; sexual or exploitative content; illegal activity; misleading or deceptive claims about the product; or other content unsuitable for a general-audience brand ad.
Scripts should match typical social short-form ad norms (no slurs, no graphic harm, no targeting protected groups negatively).

Respond with ONLY a single JSON object, no markdown fences, no other text:
{"passed": <true or false>, "feedback": "<if passed is false, a short bullet-style list of what is wrong and how to fix it; if passed is true, use an empty string>"}"""


@dataclass(frozen=True)
class ModerationVerdict:
    passed: bool
    feedback: str


def _parse_verdict_json(text: str) -> ModerationVerdict:
    raw = text.strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", raw)
    if fence:
        raw = fence.group(1).strip()
    data = json.loads(raw)
    passed = bool(data.get("passed"))
    fb = data.get("feedback")
    feedback = "" if fb is None else str(fb).strip()
    return ModerationVerdict(passed=passed, feedback=feedback)


async def evaluate_script(script: str) -> ModerationVerdict:
    """
    Evaluate whether an ad script is appropriate for production.

    Returns a verdict with pass/fail and, on fail, feedback suitable for regenerating the script.
    """
    api_key = os.getenv("SCRIPT_API_KEY", "").strip()
    model = os.getenv("SCRIPT_MODEL", "").strip()
    base_url = os.getenv("SCRIPT_BASE_URL", "").strip()
    moderation_client = AsyncOpenAI(api_key=api_key, base_url=base_url)

    user_content = f"Ad script to evaluate:\n\n{script}"

    response = await moderation_client.responses.create(
        model=model,
        instructions=_MODERATION_INSTRUCTIONS,
        input=[{"role": "user", "content": [{"type": "input_text", "text": user_content}]}],
        max_output_tokens=800,
    )

    if not response.output or len(response.output) == 0:
        raise ValueError("Moderation API returned no output")
    first_output = response.output[0]
    if not getattr(first_output, "content", None) or len(first_output.content) == 0:
        raise ValueError("Moderation API returned output with no content")
    text = first_output.content[0].text
    return _parse_verdict_json(text)
