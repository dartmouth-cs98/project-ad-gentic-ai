"""Unit tests for script moderation worker — _parse_verdict_json and evaluate_script.

Run from the backend directory:
    cd backend && python -m pytest tests/test_script_moderation_worker.py -v
"""

import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

import pytest

from workers.script_moderation_worker.worker import (
    ModerationVerdict,
    _parse_verdict_json,
    evaluate_script,
)


# ---------------------------------------------------------------------------
# Tests — _parse_verdict_json
# ---------------------------------------------------------------------------


class TestParseVerdictJson:
    """JSON parsing and markdown-fence stripping for moderation LLM output."""

    def test_passed_true_plain_json(self):
        v = _parse_verdict_json('{"passed": true, "feedback": ""}')
        assert v == ModerationVerdict(passed=True, feedback="")

    def test_passed_false_with_feedback(self):
        v = _parse_verdict_json(
            '{"passed": false, "feedback": "- Remove graphic violence\\n- Soften language"}'
        )
        assert v.passed is False
        assert "violence" in v.feedback

    def test_strips_json_markdown_fence(self):
        text = """```json
{"passed": true, "feedback": ""}
```"""
        v = _parse_verdict_json(text)
        assert v == ModerationVerdict(passed=True, feedback="")

    def test_strips_fence_without_json_language_tag(self):
        text = """```
{"passed": false, "feedback": "Fix tone"}
```"""
        v = _parse_verdict_json(text)
        assert v.passed is False
        assert v.feedback == "Fix tone"

    def test_feedback_none_becomes_empty_string(self):
        v = _parse_verdict_json('{"passed": true}')
        assert v.passed is True
        assert v.feedback == ""

    def test_missing_passed_raises(self):
        with pytest.raises(ValueError, match='missing required "passed"'):
            _parse_verdict_json('{"feedback": "only feedback"}')

    def test_passed_string_false_is_fail_not_truthy_string(self):
        """Regression: bool(\"false\") is True in Python; must parse as fail."""
        v = _parse_verdict_json('{"passed": "false", "feedback": "bad"}')
        assert v.passed is False
        assert v.feedback == "bad"

    def test_passed_string_true_accepted(self):
        v = _parse_verdict_json('{"passed": "true", "feedback": ""}')
        assert v == ModerationVerdict(passed=True, feedback="")

    def test_passed_invalid_string_raises(self):
        with pytest.raises(ValueError, match="must be JSON true/false"):
            _parse_verdict_json('{"passed": "no", "feedback": ""}')

    def test_passed_number_raises(self):
        with pytest.raises(ValueError, match="must be JSON true/false"):
            _parse_verdict_json('{"passed": 0, "feedback": ""}')

    def test_passed_null_raises(self):
        with pytest.raises(ValueError, match="must be JSON true/false"):
            _parse_verdict_json('{"passed": null, "feedback": ""}')

    def test_root_not_object_raises(self):
        with pytest.raises(ValueError, match="must be a JSON object"):
            _parse_verdict_json("[true]")

    def test_whitespace_around_payload(self):
        v = _parse_verdict_json('  \n{"passed": true, "feedback": ""}\n  ')
        assert v == ModerationVerdict(passed=True, feedback="")

    def test_non_string_feedback_coerced_to_str(self):
        v = _parse_verdict_json('{"passed": false, "feedback": 123}')
        assert v.feedback == "123"


# ---------------------------------------------------------------------------
# Tests — evaluate_script (mocked AsyncOpenAI)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_evaluate_script_returns_verdict_from_api_text():
    """evaluate_script parses model output into ModerationVerdict."""
    api_text = '{"passed": true, "feedback": ""}'
    mock_response = MagicMock()
    mock_response.output = [MagicMock(content=[MagicMock(text=api_text)])]

    mock_client = MagicMock()
    mock_client.responses.create = AsyncMock(return_value=mock_response)

    with (
        patch("workers.script_moderation_worker.worker.AsyncOpenAI", return_value=mock_client),
        patch.dict(
            "os.environ",
            {"SCRIPT_API_KEY": "test-key", "SCRIPT_MODEL": "test-model", "SCRIPT_BASE_URL": "https://api.test"},
        ),
    ):
        result = await evaluate_script("8s ad script body")

    assert result == ModerationVerdict(passed=True, feedback="")
    mock_client.responses.create.assert_awaited_once()
    call_kw = mock_client.responses.create.await_args[1]
    assert call_kw.get("model") == "test-model"
    assert "instructions" in call_kw
    user_blocks = call_kw["input"][0]["content"]
    assert user_blocks[0]["type"] == "input_text"
    assert "8s ad script body" in user_blocks[0]["text"]


@pytest.mark.asyncio
async def test_evaluate_script_raises_when_no_output():
    mock_response = MagicMock()
    mock_response.output = []

    mock_client = MagicMock()
    mock_client.responses.create = AsyncMock(return_value=mock_response)

    with (
        patch("workers.script_moderation_worker.worker.AsyncOpenAI", return_value=mock_client),
        patch.dict(
            "os.environ",
            {"SCRIPT_API_KEY": "k", "SCRIPT_MODEL": "m", "SCRIPT_BASE_URL": "https://x"},
        ),
    ):
        with pytest.raises(ValueError, match="no output"):
            await evaluate_script("script")


@pytest.mark.asyncio
async def test_evaluate_script_raises_when_output_has_no_content():
    mock_response = MagicMock()
    mock_response.output = [MagicMock(content=[])]

    mock_client = MagicMock()
    mock_client.responses.create = AsyncMock(return_value=mock_response)

    with (
        patch("workers.script_moderation_worker.worker.AsyncOpenAI", return_value=mock_client),
        patch.dict(
            "os.environ",
            {"SCRIPT_API_KEY": "k", "SCRIPT_MODEL": "m", "SCRIPT_BASE_URL": "https://x"},
        ),
    ):
        with pytest.raises(ValueError, match="no content"):
            await evaluate_script("script")


@pytest.mark.asyncio
async def test_evaluate_script_fenced_json_still_parsed():
    """Model sometimes wraps JSON in fences; _parse_verdict_json handles it."""
    api_text = '```json\n{"passed": false, "feedback": "Too edgy"}\n```'
    mock_response = MagicMock()
    mock_response.output = [MagicMock(content=[MagicMock(text=api_text)])]

    mock_client = MagicMock()
    mock_client.responses.create = AsyncMock(return_value=mock_response)

    with (
        patch("workers.script_moderation_worker.worker.AsyncOpenAI", return_value=mock_client),
        patch.dict(
            "os.environ",
            {"SCRIPT_API_KEY": "k", "SCRIPT_MODEL": "m", "SCRIPT_BASE_URL": "https://x"},
        ),
    ):
        result = await evaluate_script("x")

    assert result.passed is False
    assert result.feedback == "Too edgy"
