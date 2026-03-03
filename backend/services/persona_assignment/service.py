"""Service for assigning personas to consumers using an LLM."""

import json
from typing import Optional

from openai import AsyncOpenAI
from pydantic import BaseModel


class PersonaAssignmentResult(BaseModel):
    """Structured output from the LLM."""
    primary_persona_name: str
    secondary_persona_name: Optional[str] = None
    primary_confidence: float
    secondary_confidence: Optional[float] = None
    reasoning: str


_PERSONAS_CONTEXT = """
Available personas (use EXACT names):

1. Pragmatic Optimizer — calculated decisions based on value and efficiency
   Motivators: Efficiency, Value-for-money, Time savings
   Pain points: Wasted money, Complicated processes, Feeling tricked

2. Aspiring Achiever — driven by career growth and self-improvement
   Motivators: Career growth, Status, Self-improvement
   Pain points: Feeling stuck, FOMO, Imposter syndrome

3. Protective Provider — prioritizes security and stability for loved ones
   Motivators: Family security, Reliability, Peace of mind
   Pain points: Uncertainty, Risk to loved ones, Being unprepared

4. Conscious Consumer — values sustainability and ethical practices
   Motivators: Sustainability, Ethics, Authenticity
   Pain points: Greenwashing, Exploitative practices, Waste

5. Experience Seeker — seeks novelty and memorable moments
   Motivators: Novelty, Discovery, Memorable moments
   Pain points: Boredom, Routine, Missing out on life
"""

_PROMPT_TEMPLATE = f"""
You are analyzing consumer data to assign behavioral personas for ad targeting.

{_PERSONAS_CONTEXT}

## Consumer Traits:
{{traits}}

## Instructions:
1. Assign the BEST matching primary persona (EXACT name from list above)
2. Assign a secondary persona only if there is a clear secondary fit (otherwise null)
3. Confidence: 1.0 = perfect, 0.7-0.9 = strong, 0.5-0.7 = moderate, <0.5 = weak
4. Always return a primary match

## Response (JSON only):
{{{{
    "primary_persona_name": "Exact Persona Name",
    "secondary_persona_name": "Exact Persona Name or null",
    "primary_confidence": 0.85,
    "secondary_confidence": 0.60,
    "reasoning": "1-2 sentence explanation"
}}}}
"""


async def assign_persona(
    client: AsyncOpenAI,
    consumer_traits: dict,
) -> PersonaAssignmentResult:
    """Call the LLM to classify consumer traits into a persona."""
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{
            "role": "user",
            "content": _PROMPT_TEMPLATE.format(
                traits=json.dumps(consumer_traits, indent=2)
            ),
        }],
        response_format={"type": "json_object"},
        max_tokens=200,
        temperature=0.2,
    )
    result = json.loads(response.choices[0].message.content)
    return PersonaAssignmentResult(**result)
