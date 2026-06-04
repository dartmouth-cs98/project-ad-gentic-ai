"""Tests for consumer_traits_description service helpers and LLM wrapper."""

import sys
from datetime import date
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

import pytest

from services.consumer_traits_description.service import (
    _message_text_from_completion_response,
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


class TestMessageTextFromCompletionResponse:
    def test_extracts_string_content(self):
        msg = MagicMock()
        msg.content = "  hello  "
        choice = MagicMock()
        choice.message = msg
        resp = MagicMock()
        resp.choices = [choice]
        assert _message_text_from_completion_response(resp) == "hello"

    def test_empty_choices_raises(self):
        resp = MagicMock()
        resp.choices = []
        with pytest.raises(ValueError, match="no choices"):
            _message_text_from_completion_response(resp)

    def test_list_content_joins_text_parts(self):
        msg = MagicMock()
        msg.content = [{"type": "text", "text": "a"}, {"type": "text", "text": "b"}]
        choice = MagicMock()
        choice.message = msg
        resp = MagicMock()
        resp.choices = [choice]
        assert _message_text_from_completion_response(resp) == "ab"


@pytest.mark.asyncio
async def test_generate_returns_empty_for_empty_traits():
    with patch(
        "services.consumer_traits_description.service.get_script_llm_client_and_model"
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
        "services.consumer_traits_description.service.get_script_llm_client_and_model",
        return_value=(mock_client, "grok-2-latest"),
    ):
        out = await generate_consumer_traits_description({"age": 22})

    assert out == "A sporty consumer."
    mock_client.chat.completions.create.assert_awaited_once()
    call_kw = mock_client.chat.completions.create.await_args
    assert call_kw.kwargs["model"] == "grok-2-latest"


@pytest.mark.asyncio
async def test_generate_serializes_dates_in_traits_json():
    mock_client = MagicMock()
    msg = MagicMock()
    msg.content = "ok"
    choice = MagicMock()
    choice.message = msg
    resp = MagicMock()
    resp.choices = [choice]
    mock_client.chat.completions.create = AsyncMock(return_value=resp)

    with patch(
        "services.consumer_traits_description.service.get_script_llm_client_and_model",
        return_value=(mock_client, "grok-2-latest"),
    ):
        await generate_consumer_traits_description({"birthday": date(2024, 6, 15)})

    user_content = mock_client.chat.completions.create.await_args.kwargs["messages"][1]["content"]
    assert "2024-06-15" in user_content


@pytest.mark.asyncio
async def test_generate_with_shared_client_skips_client_factory():
    mock_client = MagicMock()
    msg = MagicMock()
    msg.content = "x"
    resp = MagicMock()
    resp.choices = [MagicMock(message=msg)]
    mock_client.chat.completions.create = AsyncMock(return_value=resp)
    shared = (mock_client, "m1")

    with patch(
        "services.consumer_traits_description.service.get_script_llm_client_and_model"
    ) as mock_get:
        await generate_consumer_traits_description({"a": 1}, _client_and_model=shared)

    mock_get.assert_not_called()
    mock_client.chat.completions.create.assert_awaited_once()


@pytest.mark.asyncio
async def test_generate_propagates_config_error_from_script_stack():
    with patch(
        "services.consumer_traits_description.service.get_script_llm_client_and_model",
        side_effect=ValueError("SCRIPT_API_KEY and SCRIPT_BASE_URL must be set"),
    ):
        with pytest.raises(ValueError, match="SCRIPT_API_KEY"):
            await generate_consumer_traits_description({"age": 1})
