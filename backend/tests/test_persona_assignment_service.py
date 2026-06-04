"""Unit tests for services/persona_assignment/service.py.

Tests cover:
- _build_personas_context: dynamic prompt context from live Persona objects
- assign_persona: correct system/user message structure sent to the LLM

No real DB or OpenAI calls required.

Run from the backend directory:
    cd backend && python -m pytest tests/test_persona_assignment_service.py -v
"""

import asyncio
import json
import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

import pytest

from models.persona import Persona
from services.persona_assignment.service import (
    PersonaAssignmentResult,
    _build_personas_context,
    assign_persona,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_persona(name: str, description: str = "A description.", motivators=None, pain_points=None) -> Persona:
    return Persona(
        id=str(uuid4()),
        name=name,
        description=description,
        key_motivators=json.dumps(motivators or ["Efficiency"]),
        pain_points=json.dumps(pain_points or ["Waste"]),
        ad_tone_preferences=None,
    )


def _run(coro):
    return asyncio.run(coro)


def _make_llm_response(payload: dict) -> MagicMock:
    """Build a fake OpenAI chat completion response."""
    message = MagicMock()
    message.content = json.dumps(payload)
    choice = MagicMock()
    choice.message = message
    response = MagicMock()
    response.choices = [choice]
    return response


# ---------------------------------------------------------------------------
# _build_personas_context
# ---------------------------------------------------------------------------


def test_build_context_includes_all_persona_names():
    personas = [
        _make_persona("Pragmatic Optimizer"),
        _make_persona("Aspiring Achiever"),
    ]
    context = _build_personas_context(personas)
    assert "Pragmatic Optimizer" in context
    assert "Aspiring Achiever" in context


def test_build_context_includes_description():
    personas = [_make_persona("Conscious Consumer", description="Cares about the planet.")]
    context = _build_personas_context(personas)
    assert "Cares about the planet." in context


def test_build_context_includes_motivators_and_pain_points():
    personas = [
        _make_persona(
            "Experience Seeker",
            motivators=["Novelty", "Discovery"],
            pain_points=["Boredom", "Routine"],
        )
    ]
    context = _build_personas_context(personas)
    assert "Novelty" in context
    assert "Discovery" in context
    assert "Boredom" in context
    assert "Routine" in context


def test_build_context_numbers_personas_sequentially():
    personas = [_make_persona(f"Persona {i}") for i in range(1, 4)]
    context = _build_personas_context(personas)
    assert "1." in context
    assert "2." in context
    assert "3." in context


def test_build_context_empty_list_returns_header_only():
    context = _build_personas_context([])
    # Should not raise; should return a non-empty string (just the header line)
    assert isinstance(context, str)
    assert len(context) > 0


# ---------------------------------------------------------------------------
# assign_persona — message structure (system / user split)
# ---------------------------------------------------------------------------


def test_assign_persona_sends_system_and_user_messages():
    """The LLM call must use a system message for instructions and a user
    message for consumer traits — providing role separation to mitigate
    prompt injection via crafted trait values."""
    persona = _make_persona("Pragmatic Optimizer")
    mock_client = AsyncMock()
    mock_client.chat.completions.create = AsyncMock(
        return_value=_make_llm_response({
            "primary_persona_name": "Pragmatic Optimizer",
            "secondary_persona_name": None,
            "primary_confidence": 0.85,
            "secondary_confidence": None,
            "reasoning": "Good fit.",
        })
    )

    _run(assign_persona(mock_client, {"age": 30}, [persona]))

    call_kwargs = mock_client.chat.completions.create.call_args
    messages = call_kwargs.kwargs.get("messages") or call_kwargs.args[0] if call_kwargs.args else call_kwargs.kwargs["messages"]

    roles = [m["role"] for m in messages]
    assert "system" in roles, "Missing system message"
    assert "user" in roles, "Missing user message"


def test_assign_persona_puts_traits_in_user_message():
    """Consumer traits must appear in the user message, not the system message,
    to prevent them from being interpreted as instructions."""
    persona = _make_persona("Pragmatic Optimizer")
    traits = {"age": 42, "interests": ["cycling", "cooking"]}

    mock_client = AsyncMock()
    mock_client.chat.completions.create = AsyncMock(
        return_value=_make_llm_response({
            "primary_persona_name": "Pragmatic Optimizer",
            "secondary_persona_name": None,
            "primary_confidence": 0.80,
            "secondary_confidence": None,
            "reasoning": "Good fit.",
        })
    )

    _run(assign_persona(mock_client, traits, [persona]))

    call_kwargs = mock_client.chat.completions.create.call_args
    messages = call_kwargs.kwargs["messages"]
    user_content = next(m["content"] for m in messages if m["role"] == "user")
    system_content = next(m["content"] for m in messages if m["role"] == "system")

    # Traits must be in the user message
    assert "cycling" in user_content
    # Traits must NOT appear in the system message (instructions only)
    assert "cycling" not in system_content


def test_assign_persona_system_message_contains_persona_names():
    """Persona names from live DB objects must appear in the system prompt."""
    personas = [
        _make_persona("Pragmatic Optimizer"),
        _make_persona("Aspiring Achiever"),
    ]
    mock_client = AsyncMock()
    mock_client.chat.completions.create = AsyncMock(
        return_value=_make_llm_response({
            "primary_persona_name": "Pragmatic Optimizer",
            "secondary_persona_name": None,
            "primary_confidence": 0.85,
            "secondary_confidence": None,
            "reasoning": "Good fit.",
        })
    )

    _run(assign_persona(mock_client, {"age": 30}, personas))

    call_kwargs = mock_client.chat.completions.create.call_args
    messages = call_kwargs.kwargs["messages"]
    system_content = next(m["content"] for m in messages if m["role"] == "system")

    assert "Pragmatic Optimizer" in system_content
    assert "Aspiring Achiever" in system_content


def test_assign_persona_returns_structured_result():
    persona = _make_persona("Pragmatic Optimizer")
    mock_client = AsyncMock()
    mock_client.chat.completions.create = AsyncMock(
        return_value=_make_llm_response({
            "primary_persona_name": "Pragmatic Optimizer",
            "secondary_persona_name": "Aspiring Achiever",
            "primary_confidence": 0.88,
            "secondary_confidence": 0.55,
            "reasoning": "Strong primary match.",
        })
    )

    result = _run(assign_persona(mock_client, {"age": 30}, [persona]))

    assert isinstance(result, PersonaAssignmentResult)
    assert result.primary_persona_name == "Pragmatic Optimizer"
    assert result.secondary_persona_name == "Aspiring Achiever"
    assert result.primary_confidence == pytest.approx(0.88)
    assert result.secondary_confidence == pytest.approx(0.55)


def test_assign_persona_handles_null_secondary():
    persona = _make_persona("Conscious Consumer")
    mock_client = AsyncMock()
    mock_client.chat.completions.create = AsyncMock(
        return_value=_make_llm_response({
            "primary_persona_name": "Conscious Consumer",
            "secondary_persona_name": None,
            "primary_confidence": 0.92,
            "secondary_confidence": None,
            "reasoning": "Clear primary fit only.",
        })
    )

    result = _run(assign_persona(mock_client, {"values": ["eco"]}, [persona]))

    assert result.secondary_persona_name is None
    assert result.secondary_confidence is None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
