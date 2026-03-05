"""Service for assigning personas to consumers using an LLM."""

import json
from typing import Optional

from openai import AsyncOpenAI
from pydantic import BaseModel

from models.persona import Persona


class PersonaAssignmentResult(BaseModel):
    """Structured output from the LLM."""
    primary_persona_name: str
    secondary_persona_name: Optional[str] = None
    primary_confidence: float
    secondary_confidence: Optional[float] = None
    reasoning: str


def _build_personas_context(personas: list[Persona]) -> str:
    """Build the persona reference block from live DB records."""
    lines = ["Available personas (use EXACT names):\n"]
    for i, p in enumerate(personas, start=1):
        motivators = ", ".join(p.get_key_motivators())
        pain_points = ", ".join(p.get_pain_points())
        lines.append(
            f"{i}. {p.name} — {p.description}\n"
            f"   Motivators: {motivators}\n"
            f"   Pain points: {pain_points}\n"
        )
    return "\n".join(lines)


_SYSTEM_TEMPLATE = """\
You are analyzing consumer data to assign behavioral personas for ad targeting.

{personas_context}

Instructions:
1. Assign the BEST matching primary persona (EXACT name from list above).
2. Assign a secondary persona only if there is a clear secondary fit (otherwise null).
3. Confidence: 1.0 = perfect, 0.7-0.9 = strong, 0.5-0.7 = moderate, <0.5 = weak.
4. Always return a primary match.

Respond with JSON only:
{{
    "primary_persona_name": "Exact Persona Name",
    "secondary_persona_name": "Exact Persona Name or null",
    "primary_confidence": 0.85,
    "secondary_confidence": 0.60,
    "reasoning": "1-2 sentence explanation"
}}"""


async def assign_persona(
    client: AsyncOpenAI,
    consumer_traits: dict,
    personas: list[Persona],
) -> PersonaAssignmentResult:
    """Call the LLM to classify consumer traits into a persona.

    Args:
        client: Shared AsyncOpenAI instance.
        consumer_traits: Parsed traits dict for the consumer.
        personas: Live persona rows from the DB — used to build the prompt.
    """
    if not personas:
        raise ValueError(
            "assign_persona called with an empty personas list; cannot assign persona "
            "without available options."
        )
    system_prompt = _SYSTEM_TEMPLATE.format(
        personas_context=_build_personas_context(personas)
    )
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": json.dumps(consumer_traits, indent=2)},
        ],
        response_format={"type": "json_object"},
        max_tokens=200,
        temperature=0.2,
    )
    result = json.loads(response.choices[0].message.content)
    return PersonaAssignmentResult(**result)
