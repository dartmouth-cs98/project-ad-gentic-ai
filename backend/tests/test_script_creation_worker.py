"""Unit tests for script creation worker — _build_script_prompt, generate_ad_script, batch_generate_ad_scripts.

Requires: pytest-asyncio for async tests.
Run from the backend directory:
    cd backend && python -m pytest tests/test_script_creation_worker.py -v
"""

import sys
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

import pytest

from schemas.generation_preferences import GenerationPreferences
from workers.script_creation_worker.worker import (
    _build_script_prompt,
    _format_campaign_context_block,
    generate_ad_script,
    batch_generate_ad_scripts,
)


# ---------------------------------------------------------------------------
# Tests — _build_script_prompt (pure function, no mocks)
# ---------------------------------------------------------------------------


class TestBuildScriptPrompt:
    """_build_script_prompt builds a prompt string with product, consumer, and campaign context."""

    def test_includes_product_name_and_description(self):
        out = _build_script_prompt(
            product_name="Cool Sneakers",
            product_description="Running shoes for everyone",
            consumer_profile_text="Fitness enthusiast",
            campaign_brief="Launch the spring line.",
        )
        assert "Cool Sneakers" in out
        assert "Running shoes for everyone" in out

    def test_includes_consumer_profile(self):
        out = _build_script_prompt(
            product_name="X",
            product_description="Y",
            consumer_profile_text="Age 25-34, loves hiking",
            campaign_brief="",
        )
        assert "Age 25-34, loves hiking" in out

    def test_includes_campaign_brief(self):
        out = _build_script_prompt(
            product_name="X",
            product_description="Y",
            consumer_profile_text="Z",
            campaign_brief="Focus on sustainability.",
        )
        assert "Focus on sustainability." in out
        assert "Campaign Brief:" in out

    def test_campaign_brief_default_empty(self):
        out = _build_script_prompt(
            product_name="A",
            product_description="B",
            consumer_profile_text="C",
        )
        assert "Campaign Brief:" in out

    def test_product_description_not_provided(self):
        out = _build_script_prompt(
            product_name="Prod",
            product_description="",
            consumer_profile_text="",
            campaign_brief="",
        )
        assert "Not provided" in out

    def test_includes_structured_campaign_context_when_fields_set(self):
        out = _build_script_prompt(
            product_name="X",
            product_description="Y",
            consumer_profile_text="Z",
            campaign_brief="Hero the new colorway.",
            campaign_name="Drop Week",
            campaign_goal="Conversions",
            campaign_target_audience="Sneakerheads",
            campaign_product_context="Limited run; urgency without hype-beast clichés",
        )
        assert "Campaign context" in out
        assert "Campaign name: Drop Week" in out
        assert "Campaign goal: Conversions" in out
        assert "Target audience (campaign): Sneakerheads" in out
        assert "Product in campaign context:" in out
        assert "urgency without hype-beast" in out
        assert "Creative direction" in out
        assert "Hero the new colorway." in out

    def test_omits_campaign_context_block_when_all_empty(self):
        out = _build_script_prompt(
            product_name="A",
            product_description="B",
            consumer_profile_text="C",
            campaign_brief="Only brief",
            campaign_name="",
            campaign_goal="",
            campaign_target_audience="",
            campaign_product_context="   ",
        )
        assert "Campaign context (strategic" not in out
        assert "Only brief" in out

    def test_includes_generation_preferences_block_when_set(self):
        prefs = GenerationPreferences(
            tone="minimal",
            language="English (US)",
            platforms=["Facebook Feed"],
            cta_style="soft",
            budget_tier="premium",
            color_mode="custom",
            custom_color="#FF00AA",
        )
        out = _build_script_prompt(
            product_name="X",
            product_description="Y",
            consumer_profile_text="Z",
            campaign_brief="Brief here.",
            generation_preferences=prefs,
        )
        assert "User-approved generation preferences" in out
        assert "Tone: minimal" in out
        assert "Facebook Feed" in out
        assert "#FF00AA" in out
        assert "Brief here." in out

    def test_includes_time_bucketed_beats(self):
        out = _build_script_prompt(
            product_name="X",
            product_description="Y",
            consumer_profile_text="Z",
            campaign_brief="",
        )
        assert "## Beat 1 — 0–2s (hook)" in out
        assert "## Beat 2 — 2–5s (setup)" in out
        assert "## Beat 3 — 5–9s (payoff)" in out
        assert "## Beat 4 — 9–12s (product moment)" in out
        assert "Audio-safe timeline" in out
        assert "0.5s" in out and "11.35s" in out

    def test_beat_headers_match_video_seconds_eight(self, monkeypatch):
        monkeypatch.setenv("VIDEO_SECONDS", "8")
        out = _build_script_prompt(
            product_name="X",
            product_description="Y",
            consumer_profile_text="Z",
            campaign_brief="",
        )
        assert "## Beat 1 — 0–1s (hook)" in out
        assert "## Beat 2 — 1–3s (setup)" in out
        assert "## Beat 3 — 3–6s (payoff)" in out
        assert "## Beat 4 — 6–8s (product moment)" in out
        assert "8 seconds exactly" in out
        assert "7.35" in out

    def test_beat_headers_match_video_seconds_four(self, monkeypatch):
        monkeypatch.setenv("VIDEO_SECONDS", "4")
        out = _build_script_prompt(
            product_name="X",
            product_description="Y",
            consumer_profile_text="Z",
            campaign_brief="",
        )
        assert "## Beat 1 — 0–1s (hook)" in out
        assert "## Beat 4 — 3–4s (product moment)" in out
        assert "4 seconds exactly" in out
        assert "3.35" in out

    def test_includes_per_beat_fields_for_video_model(self):
        out = _build_script_prompt(
            product_name="X",
            product_description="Y",
            consumer_profile_text="Z",
            campaign_brief="",
        )
        assert "- What we see:" in out
        assert "- Camera move:" in out
        assert "- Lighting:" in out
        assert "- Action:" in out
        assert "- Line (approx. word count):" in out


class TestFormatCampaignContextBlock:
    def test_empty_inputs_return_empty_string(self):
        assert _format_campaign_context_block() == ""

    def test_whitespace_only_returns_empty_string(self):
        assert _format_campaign_context_block(campaign_name="  \n  ") == ""


# ---------------------------------------------------------------------------
# Tests — generate_ad_script (mocked AsyncOpenAI)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_generate_ad_script_returns_script_from_mock_client():
    """generate_ad_script calls the API and returns the script content."""
    fake_content = "Scene 1: Open on product. Scene 2: ..."
    mock_response = MagicMock()
    # Responses API shape: output is list of items, each with content list and text
    mock_response.output = [MagicMock(content=[MagicMock(text=fake_content)])]

    mock_client = MagicMock()
    mock_client.responses.create = AsyncMock(return_value=mock_response)

    with (
        patch("workers.script_creation_worker.worker.AsyncOpenAI", return_value=mock_client),
        patch.dict("os.environ", {"SCRIPT_API_KEY": "test-key", "SCRIPT_MODEL": "test-model", "SCRIPT_BASE_URL": "https://api.test"}),
    ):
        result = await generate_ad_script(
            product_name="Test Product",
            product_description="Desc",
            product_image_data_url="data:image/png;base64,abc",
            consumer_traits_string="age: 25",
            campaign_brief="Brief",
        )

    assert result == fake_content
    mock_client.responses.create.assert_awaited_once()
    call_kw = mock_client.responses.create.await_args[1]
    assert call_kw.get("model") == "test-model"
    assert "input" in call_kw


# ---------------------------------------------------------------------------
# Tests — batch_generate_ad_scripts (mocked xai_sdk Client)
# ---------------------------------------------------------------------------


def _make_consumer(
    id: int,
    traits: str | None,
    consumer_traits_description: str | None = None,
):
    """Consumer-like object with .id, .traits, and optional .consumer_traits_description."""
    return SimpleNamespace(
        id=id,
        traits=traits,
        consumer_traits_description=consumer_traits_description,
    )


class TestBatchGenerateAdScripts:
    """batch_generate_ad_scripts creates a batch and returns its batch_id."""

    def test_returns_batch_id_from_created_batch(self):
        mock_batch = MagicMock()
        mock_batch.batch_id = "batch-abc-123"
        mock_chat = MagicMock()
        mock_client = MagicMock()
        mock_client.batch.create.return_value = mock_batch
        mock_client.chat.create.return_value = mock_chat

        with (
            patch("workers.script_creation_worker.worker.Client", return_value=mock_client),
            patch.dict(
                "os.environ",
                {"SCRIPT_API_KEY": "key", "SCRIPT_MODEL": "model", "SCRIPT_BASE_URL": "https://api.test"},
            ),
        ):
            consumers = [_make_consumer(1, '{"age": "25"}')]
            result = batch_generate_ad_scripts(
                product_name="P",
                product_description="D",
                consumers=consumers,
                product_image_data_url="data:image/png;base64,x",
                campaign_brief="",
            )

        assert result == "batch-abc-123"
        mock_client.batch.create.assert_called_once_with(batch_name="batch_generate_ad_scripts")

    def test_creates_one_chat_per_consumer_and_adds_to_batch(self):
        mock_batch = MagicMock()
        mock_batch.batch_id = "bid"
        mock_chat = MagicMock()
        mock_client = MagicMock()
        mock_client.batch.create.return_value = mock_batch
        mock_client.chat.create.return_value = mock_chat

        with (
            patch("workers.script_creation_worker.worker.Client", return_value=mock_client),
            patch.dict(
                "os.environ",
                {"SCRIPT_API_KEY": "k", "SCRIPT_MODEL": "m", "SCRIPT_BASE_URL": "https://x"},
            ),
        ):
            consumers = [
                _make_consumer(1, '{"a": "1"}'),
                _make_consumer(2, '{"b": "2"}'),
            ]
            batch_generate_ad_scripts(
                product_name="P",
                product_description="D",
                consumers=consumers,
                product_image_data_url="data:image/jpeg;base64,y",
                campaign_brief="Brief",
            )

        assert mock_client.chat.create.call_count == 2
        mock_client.chat.create.assert_any_call(model="m", batch_request_id=1)
        mock_client.chat.create.assert_any_call(model="m", batch_request_id=2)
        mock_client.batch.add.assert_called_once()
        call_kw = mock_client.batch.add.call_args[1]
        assert call_kw["batch_id"] == "bid"
        assert len(call_kw["batch_requests"]) == 2

    def test_parses_consumer_traits_json_into_prompt(self):
        mock_batch = MagicMock()
        mock_batch.batch_id = "bid"
        mock_chat = MagicMock()
        mock_client = MagicMock()
        mock_client.batch.create.return_value = mock_batch
        mock_client.chat.create.return_value = mock_chat

        with (
            patch("workers.script_creation_worker.worker.Client", return_value=mock_client),
            patch.dict(
                "os.environ",
                {"SCRIPT_API_KEY": "k", "SCRIPT_MODEL": "m", "SCRIPT_BASE_URL": "https://x"},
            ),
        ):
            consumers = [_make_consumer(1, '{"age": "25", "interest": "hiking"}')]
            batch_generate_ad_scripts(
                product_name="Prod",
                product_description="Desc",
                consumers=consumers,
                product_image_data_url="data:image/png;base64,z",
                campaign_brief="",
            )

        # Chat.append should be called with system then user; user content should contain formatted traits
        assert mock_chat.append.call_count >= 2
        user_calls = [c for c in mock_chat.append.call_args_list if _call_contains_traits(c, "25")]
        assert user_calls, "expected user message to contain parsed trait value (25)"
        user_calls = [c for c in mock_chat.append.call_args_list if _call_contains_traits(c, "hiking")]
        assert user_calls, "expected user message to contain parsed trait value (hiking)"

    def test_prefers_consumer_traits_description_over_trait_lines(self):
        mock_batch = MagicMock()
        mock_batch.batch_id = "bid"
        mock_chat = MagicMock()
        mock_client = MagicMock()
        mock_client.batch.create.return_value = mock_batch
        mock_client.chat.create.return_value = mock_chat

        with (
            patch("workers.script_creation_worker.worker.Client", return_value=mock_client),
            patch.dict(
                "os.environ",
                {"SCRIPT_API_KEY": "k", "SCRIPT_MODEL": "m", "SCRIPT_BASE_URL": "https://x"},
            ),
        ):
            consumers = [
                _make_consumer(
                    1,
                    '{"age": "99", "interest": "should-not-appear"}',
                    "Only this prose should appear in the prompt.",
                )
            ]
            batch_generate_ad_scripts(
                product_name="Prod",
                product_description="Desc",
                consumers=consumers,
                product_image_data_url="data:image/png;base64,z",
                campaign_brief="",
            )

        assert mock_chat.append.call_count >= 2
        prose_calls = [
            c
            for c in mock_chat.append.call_args_list
            if _call_contains_traits(c, "Only this prose should appear in the prompt.")
        ]
        assert prose_calls, "expected user message to use consumer_traits_description"
        assert not any(
            _call_contains_traits(c, "should-not-appear") for c in mock_chat.append.call_args_list
        )

    def test_handles_empty_or_none_traits(self):
        mock_batch = MagicMock()
        mock_batch.batch_id = "bid"
        mock_chat = MagicMock()
        mock_client = MagicMock()
        mock_client.batch.create.return_value = mock_batch
        mock_client.chat.create.return_value = mock_chat

        with (
            patch("workers.script_creation_worker.worker.Client", return_value=mock_client),
            patch.dict(
                "os.environ",
                {"SCRIPT_API_KEY": "k", "SCRIPT_MODEL": "m", "SCRIPT_BASE_URL": "https://x"},
            ),
        ):
            consumers = [
                _make_consumer(1, None),
                _make_consumer(2, ""),
            ]
            result = batch_generate_ad_scripts(
                product_name="P",
                product_description="D",
                consumers=consumers,
                product_image_data_url="data:image/png;base64,a",
                campaign_brief="",
            )

        assert result == "bid"
        assert mock_client.chat.create.call_count == 2
        mock_client.batch.add.assert_called_once()
        assert len(mock_client.batch.add.call_args[1]["batch_requests"]) == 2


def _call_contains_traits(call, fragment: str) -> bool:
    """True if the call's args or kwargs contain a string with fragment (for trait value checks)."""
    try:
        args_str = " ".join(str(a) for a in call[0])
        return fragment in args_str
    except (IndexError, TypeError):
        return False
