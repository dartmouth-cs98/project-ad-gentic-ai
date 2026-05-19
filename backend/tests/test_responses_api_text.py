"""Tests for Responses API text extraction (Grok reasoning + message outputs)."""

import sys
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

from utils.responses_api_text import extract_responses_api_text


def test_extract_uses_output_text_when_present():
    response = SimpleNamespace(output_text="  hello  ", output=[])
    assert extract_responses_api_text(response) == "hello"


def test_extract_single_message_output():
    response = SimpleNamespace(
        output_text=None,
        output=[
            SimpleNamespace(
                type="message",
                content=[SimpleNamespace(text="Beat 1 script", type="output_text")],
            )
        ],
    )
    assert extract_responses_api_text(response) == "Beat 1 script"


def test_extract_skips_reasoning_and_uses_message():
    reasoning = SimpleNamespace(
        type="reasoning",
        summary=[SimpleNamespace(text="thinking...", type="summary_text")],
    )
    message = SimpleNamespace(
        type="message",
        content=[
            SimpleNamespace(
                text="Overview: Storytime ad.\n\n## Beat 1",
                type="output_text",
            )
        ],
    )
    response = SimpleNamespace(output_text=None, output=[reasoning, message])
    assert extract_responses_api_text(response) == "Overview: Storytime ad.\n\n## Beat 1"


def test_extract_returns_last_message_when_multiple():
    first = SimpleNamespace(
        type="message",
        content=[SimpleNamespace(text="draft", type="output_text")],
    )
    second = SimpleNamespace(
        type="message",
        content=[SimpleNamespace(text="final script", type="output_text")],
    )
    response = SimpleNamespace(output_text=None, output=[first, second])
    assert extract_responses_api_text(response) == "final script"


def test_extract_returns_empty_when_only_reasoning():
    response = SimpleNamespace(
        output_text=None,
        output=[
            SimpleNamespace(
                type="reasoning",
                summary=[SimpleNamespace(text="plan only", type="summary_text")],
            )
        ],
    )
    assert extract_responses_api_text(response) == ""


def test_extract_works_with_magic_mock_sdk_objects():
    """Mimic OpenAI SDK objects accessed via getattr."""
    part = MagicMock()
    part.text = "from mock"
    msg = MagicMock()
    msg.type = "message"
    msg.content = [part]
    response = MagicMock()
    response.output_text = None
    response.output = [msg]
    assert extract_responses_api_text(response) == "from mock"
