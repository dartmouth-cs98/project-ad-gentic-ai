"""Tests for consumer_traits_description service helpers and LLM wrapper."""

import sys
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

import pytest

from services.consumer_traits_description.service import (
    consumer_profile_text_for_script,
    generate_consumer_traits_description,
    legacy_traits_prompt_lines,
)


class TestLegacyTraitsPromptLines:
    def test_formats_key_value_lines(self):
        assert legacy_traits_prompt_lines({"age": 30, "city": "NYC"}) == "age: 30\ncity: NYC"

    def test_empty_dict(self):
        assert legacy_traits_prompt_lines({}) == ""


class TestConsumerProfileTextForScript:
    def test_prefers_non_empty_description(self):
        c = SimpleNamespace(
            id=1,
            traits='{"age": "99"}',
            consumer_traits_description="  Narrative only.  ",
        )
        assert consumer_profile_text_for_script(c) == "Narrative only."

    def test_falls_back_to_traits_lines(self):
        c = SimpleNamespace(
            id=2,
            traits='{"age": "25", "interest": "hiking"}',
            consumer_traits_description=None,
        )
        out = consumer_profile_text_for_script(c)
        assert "age: 25" in out and "interest: hiking" in out

    def test_falls_back_when_description_blank(self):
        c = SimpleNamespace(
            id=3,
            traits='{"a": "b"}',
            consumer_traits_description="   ",
        )
        assert consumer_profile_text_for_script(c) == "a: b"


@pytest.mark.asyncio
async def test_generate_returns_empty_for_empty_traits():
    with patch(
        "services.consumer_traits_description.service._script_compatible_client"
    ) as mock_cfg:
        assert await generate_consumer_traits_description({}) == ""
        mock_cfg.assert_not_called()


@pytest.mark.asyncio
async def test_generate_uses_script_client_and_returns_content():
    mock_client = MagicMock()
    msg = MagicMock()
    msg.content = "  A sporty consumer.  "
    choice = MagicMock()
    choice.message = msg
    resp = MagicMock()
    resp.choices = [choice]
    mock_client.chat.completions.create = AsyncMock(return_value=resp)

    with patch(
        "services.consumer_traits_description.service._script_compatible_client",
        return_value=(mock_client, "grok-2-latest"),
    ):
        out = await generate_consumer_traits_description({"age": 22})

    assert out == "A sporty consumer."
    mock_client.chat.completions.create.assert_awaited_once()
    call_kw = mock_client.chat.completions.create.await_args
    assert call_kw.kwargs["model"] == "grok-2-latest"


@pytest.mark.asyncio
async def test_generate_propagates_config_error_from_script_stack():
    with patch(
        "services.consumer_traits_description.service._script_compatible_client",
        side_effect=ValueError("SCRIPT_API_KEY and SCRIPT_BASE_URL must be set"),
    ):
        with pytest.raises(ValueError, match="SCRIPT_API_KEY"):
            await generate_consumer_traits_description({"age": 1})
