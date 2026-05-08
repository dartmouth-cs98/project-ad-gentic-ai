"""Unit tests for ad job worker — execute_ad_job with mocked DB, blob, and OpenAI.

Requires: azure-storage-blob, pytest-asyncio (for async tests).
Run from the backend directory:
    cd backend && pip install -r requirements.txt && python -m pytest tests/test_ad_job_worker.py -v
"""

import json
import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

import pytest

pytest.importorskip("azure.storage.blob", reason="azure-storage-blob required for ad_job_worker tests")
from azure.core.exceptions import ResourceNotFoundError
from utils.product_image_names import first_product_image_blob_name
from workers.ad_job_worker.errors import AdJobClientError
from workers.ad_job_worker.worker import (
    execute_ad_job,
    _brief_for_version,
    generate_campaign_preview,
    generate_campaign_ad_variants,
)
from workers.script_moderation_worker.worker import ModerationVerdict

_PASS_MODERATION = ModerationVerdict(passed=True, feedback="")


# ---------------------------------------------------------------------------
# Tests — _brief_for_version
# ---------------------------------------------------------------------------


class TestBriefForVersion:
    """campaign.brief is JSON with keys = version_number, value = brief text."""

    def test_returns_brief_for_version_string_key(self):
        assert _brief_for_version('{"1": "Brief v1", "2": "Brief v2"}', 1) == "Brief v1"
        assert _brief_for_version('{"1": "Brief v1", "2": "Brief v2"}', 2) == "Brief v2"

    def test_returns_empty_for_missing_version(self):
        assert _brief_for_version('{"1": "Only v1"}', 2) == ""

    def test_returns_empty_for_empty_or_invalid_json(self):
        assert _brief_for_version("", 1) == ""
        assert _brief_for_version(None, 1) == ""
        assert _brief_for_version("not json", 1) == ""

    def test_preserves_empty_string_brief_for_version(self):
        assert _brief_for_version('{"1": ""}', 1) == ""


class TestFirstProductImageBlobName:
    """image_name column may be JSON array (multi-upload), legacy plain blob name, or empty."""

    def test_json_array_uses_first_blob(self):
        assert first_product_image_blob_name('["a.jpg", "b.jpg"]') == "a.jpg"

    def test_legacy_plain_name(self):
        assert first_product_image_blob_name("blob-name.png") == "blob-name.png"

    def test_empty_none(self):
        assert first_product_image_blob_name(None) is None
        assert first_product_image_blob_name("") is None
        assert first_product_image_blob_name("[]") is None


# ---------------------------------------------------------------------------
# Fixtures — mock DB, blob, script, video
# ---------------------------------------------------------------------------


@pytest.fixture
def mock_db():
    """Session that doesn't touch a real DB."""
    return MagicMock()


@pytest.fixture
def mock_session_factory(mock_db):
    """Factory that returns our mock session."""
    factory = MagicMock()
    factory.return_value = mock_db
    return factory


@pytest.fixture
def mock_ad_variant():
    """Fake ad variant with an id (int) for return from create_ad_variant."""
    v = MagicMock()
    v.id = 42
    return v


@pytest.fixture
def mock_campaign():
    """Fake campaign with brief as JSON: keys = version_number, value = brief text."""
    c = MagicMock()
    c.brief = '{"1": "Test campaign brief"}'
    c.name = "Spring Launch"
    c.goal = "Drive awareness"
    c.target_audience = "Urban commuters 18-35"
    c.product_context = "Feature the travel-size SKU"
    return c


@pytest.fixture
def mock_consumer():
    """Fake consumer with traits JSON."""
    c = MagicMock()
    c.traits = '{"age": "25-34", "interest": "fitness"}'
    return c


@pytest.fixture
def mock_product():
    """Fake product with name, description, image_name (used by worker for blob lookup)."""
    p = MagicMock()
    p.name = "Test Product"
    p.description = "A great product"
    p.image_name = "product-image.png"
    return p


@pytest.fixture
def mock_blob_client():
    """Fake BlobClient: download returns bytes, upload is no-op, url set."""
    client = MagicMock()
    download = MagicMock()
    download.readall.return_value = b"fake image bytes"
    client.download_blob.return_value = download
    props = MagicMock()
    props.content_settings.content_type = "image/png"
    props.name = "product-image.png"
    client.get_blob_properties.return_value = props
    client.url = "https://example.blob.core.windows.net/container/blob"
    return client


@pytest.mark.asyncio
async def test_execute_ad_job_blob_not_found_on_readall_raises_ad_job_client_error(
    mock_db,
    mock_session_factory,
    mock_ad_variant,
    mock_campaign,
    mock_consumer,
    mock_product,
):
    """404 during stream read must map to AdJobClientError (same as missing blob on download)."""
    download = MagicMock()
    download.readall.side_effect = ResourceNotFoundError()
    blob_client = MagicMock()
    blob_client.download_blob.return_value = download

    with (
        patch("workers.ad_job_worker.worker._get_session_factory", return_value=mock_session_factory),
        patch("workers.ad_job_worker.worker.create_ad_variant", return_value=mock_ad_variant),
        patch("workers.ad_job_worker.worker.update_ad_variant"),
        patch("workers.ad_job_worker.worker.get_campaign", return_value=mock_campaign),
        patch("workers.ad_job_worker.worker.get_consumer", return_value=mock_consumer),
        patch("workers.ad_job_worker.worker.get_product", return_value=mock_product),
        patch("workers.ad_job_worker.worker.BlobClient") as blob_cls,
    ):
        blob_cls.from_connection_string.return_value = blob_client
        with pytest.raises(AdJobClientError, match="Product image not found"):
            await execute_ad_job(campaign_id=1, product_id=1, consumer_id=1, version_number=1)


@pytest.mark.asyncio
async def test_execute_ad_job_returns_ad_variant_id(
    mock_db,
    mock_session_factory,
    mock_ad_variant,
    mock_campaign,
    mock_consumer,
    mock_product,
    mock_blob_client,
):
    """execute_ad_job with all deps mocked returns the created ad_variant id."""
    with (
        patch("workers.ad_job_worker.worker._get_session_factory", return_value=mock_session_factory),
        patch("workers.ad_job_worker.worker.create_ad_variant", return_value=mock_ad_variant),
        patch("workers.ad_job_worker.worker.update_ad_variant"),
        patch("workers.ad_job_worker.worker.get_campaign", return_value=mock_campaign),
        patch("workers.ad_job_worker.worker.get_consumer", return_value=mock_consumer),
        patch("workers.ad_job_worker.worker.get_product", return_value=mock_product),
        patch("workers.ad_job_worker.worker.BlobClient") as blob_cls,
        patch("workers.ad_job_worker.worker.evaluate_script", new_callable=AsyncMock, return_value=_PASS_MODERATION),
        patch("workers.ad_job_worker.worker.generate_ad_script", new_callable=AsyncMock, return_value="Mock script text"),
        patch("workers.ad_job_worker.worker.generate_ad_video", new_callable=AsyncMock, return_value=b"mock video bytes"),
    ):
        blob_cls.from_connection_string.return_value = mock_blob_client

        result = await execute_ad_job(
            campaign_id=1,
            product_id=1,
            consumer_id=1,
            version_number=1,
        )

    assert result == 42
    mock_db.close.assert_called_once()
    # Script and video helpers should have been called
    from workers.ad_job_worker.worker import generate_ad_script, generate_ad_video
    # (patched, so we just check they were invoked via the fact that result is 42 and no exception)


@pytest.mark.asyncio
async def test_execute_ad_job_calls_generate_ad_script_with_expected_args(
    mock_db,
    mock_session_factory,
    mock_ad_variant,
    mock_campaign,
    mock_consumer,
    mock_product,
    mock_blob_client,
):
    """execute_ad_job passes product name, description, consumer traits, and campaign brief to generate_ad_script."""
    mock_gen_script = AsyncMock(return_value="Script")
    with (
        patch("workers.ad_job_worker.worker._get_session_factory", return_value=mock_session_factory),
        patch("workers.ad_job_worker.worker.create_ad_variant", return_value=mock_ad_variant),
        patch("workers.ad_job_worker.worker.update_ad_variant"),
        patch("workers.ad_job_worker.worker.get_campaign", return_value=mock_campaign),
        patch("workers.ad_job_worker.worker.get_consumer", return_value=mock_consumer),
        patch("workers.ad_job_worker.worker.get_product", return_value=mock_product),
        patch("workers.ad_job_worker.worker.BlobClient") as blob_cls,
        patch("workers.ad_job_worker.worker.evaluate_script", new_callable=AsyncMock, return_value=_PASS_MODERATION),
        patch("workers.ad_job_worker.worker.generate_ad_script", mock_gen_script),
        patch("workers.ad_job_worker.worker.generate_ad_video", new_callable=AsyncMock, return_value=b"video"),
    ):
        blob_cls.from_connection_string.return_value = mock_blob_client

        await execute_ad_job(campaign_id=1, product_id=1, consumer_id=1, version_number=1)

    call_kw = mock_gen_script.await_args
    assert call_kw is not None
    args = call_kw[0]
    kwargs = call_kw[1]
    assert args[0] == "Test Product"
    assert args[1] == "A great product"
    assert "data:image/png;base64," in args[2]
    assert "age" in args[3] and "fitness" in args[3]
    assert args[4] == "Test campaign brief"


@pytest.mark.asyncio
async def test_execute_ad_job_prefers_consumer_traits_description(
    mock_db,
    mock_session_factory,
    mock_ad_variant,
    mock_campaign,
    mock_consumer,
    mock_product,
    mock_blob_client,
):
    """When consumer_traits_description is set, it is passed to generate_ad_script instead of trait lines."""
    mock_consumer.consumer_traits_description = "A narrative-only audience blurb."
    mock_consumer.traits = '{"age": "99", "interest": "ignored"}'
    mock_gen_script = AsyncMock(return_value="Script")
    with (
        patch("workers.ad_job_worker.worker._get_session_factory", return_value=mock_session_factory),
        patch("workers.ad_job_worker.worker.create_ad_variant", return_value=mock_ad_variant),
        patch("workers.ad_job_worker.worker.update_ad_variant"),
        patch("workers.ad_job_worker.worker.get_campaign", return_value=mock_campaign),
        patch("workers.ad_job_worker.worker.get_consumer", return_value=mock_consumer),
        patch("workers.ad_job_worker.worker.get_product", return_value=mock_product),
        patch("workers.ad_job_worker.worker.BlobClient") as blob_cls,
        patch("workers.ad_job_worker.worker.evaluate_script", new_callable=AsyncMock, return_value=_PASS_MODERATION),
        patch("workers.ad_job_worker.worker.generate_ad_script", mock_gen_script),
        patch("workers.ad_job_worker.worker.generate_ad_video", new_callable=AsyncMock, return_value=b"video"),
    ):
        blob_cls.from_connection_string.return_value = mock_blob_client

        await execute_ad_job(campaign_id=1, product_id=1, consumer_id=1, version_number=1)

    call_kw = mock_gen_script.await_args
    args = call_kw[0]
    kwargs = call_kw[1]
    assert args[3] == "A narrative-only audience blurb."
    assert kwargs.get("campaign_name") == "Spring Launch"
    assert kwargs.get("campaign_goal") == "Drive awareness"
    assert kwargs.get("campaign_target_audience") == "Urban commuters 18-35"
    assert kwargs.get("campaign_product_context") == "Feature the travel-size SKU"


@pytest.mark.asyncio
async def test_execute_ad_job_calls_generate_ad_video_with_script_and_image(
    mock_db,
    mock_session_factory,
    mock_ad_variant,
    mock_campaign,
    mock_consumer,
    mock_product,
    mock_blob_client,
):
    """execute_ad_job passes script and image bytes/type/filename to generate_ad_video."""
    mock_generate_video = AsyncMock(return_value=b"video")
    with (
        patch("workers.ad_job_worker.worker._get_session_factory", return_value=mock_session_factory),
        patch("workers.ad_job_worker.worker.create_ad_variant", return_value=mock_ad_variant),
        patch("workers.ad_job_worker.worker.update_ad_variant"),
        patch("workers.ad_job_worker.worker.get_campaign", return_value=mock_campaign),
        patch("workers.ad_job_worker.worker.get_consumer", return_value=mock_consumer),
        patch("workers.ad_job_worker.worker.get_product", return_value=mock_product),
        patch("workers.ad_job_worker.worker.BlobClient") as blob_cls,
        patch("workers.ad_job_worker.worker.evaluate_script", new_callable=AsyncMock, return_value=_PASS_MODERATION),
        patch("workers.ad_job_worker.worker.generate_ad_script", new_callable=AsyncMock, return_value="Script"),
        patch("workers.ad_job_worker.worker.generate_ad_video", mock_generate_video),
    ):
        blob_cls.from_connection_string.return_value = mock_blob_client

        await execute_ad_job(campaign_id=1, product_id=1, consumer_id=1, version_number=1)

    call_args = mock_generate_video.await_args[0]
    assert call_args[0] == "Script"
    assert call_args[1] == b"fake image bytes"
    assert call_args[2] == "image/png"
    assert call_args[3] == "product-image.png"


@pytest.mark.asyncio
async def test_execute_ad_job_uses_image_name_fallback(mock_db, mock_session_factory, mock_ad_variant, mock_campaign, mock_consumer, mock_blob_client):
    """Product without image_url uses image_name or placeholder."""
    product = MagicMock()
    product.name = "Prod"
    product.description = "Desc"
    product.image_url = None
    product.image_name = "blob-name.png"

    with (
        patch("workers.ad_job_worker.worker._get_session_factory", return_value=mock_session_factory),
        patch("workers.ad_job_worker.worker.create_ad_variant", return_value=mock_ad_variant),
        patch("workers.ad_job_worker.worker.update_ad_variant"),
        patch("workers.ad_job_worker.worker.get_campaign", return_value=mock_campaign),
        patch("workers.ad_job_worker.worker.get_consumer", return_value=mock_consumer),
        patch("workers.ad_job_worker.worker.get_product", return_value=product),
        patch("workers.ad_job_worker.worker.BlobClient") as blob_cls,
        patch("workers.ad_job_worker.worker.evaluate_script", new_callable=AsyncMock, return_value=_PASS_MODERATION),
        patch("workers.ad_job_worker.worker.generate_ad_script", new_callable=AsyncMock, return_value="S"),
        patch("workers.ad_job_worker.worker.generate_ad_video", new_callable=AsyncMock, return_value=b"v"),
    ):
        blob_cls.from_connection_string.return_value = mock_blob_client

        await execute_ad_job(campaign_id=1, product_id=1, consumer_id=1, version_number=1)

    # Blob client should be created with blob name from product (product-images container)
    calls = blob_cls.from_connection_string.call_args_list
    blob_names = [c[1].get("blob_name", "") for c in calls if len(c) > 1 and isinstance(c[1], dict)]
    assert "blob-name.png" in blob_names


@pytest.mark.asyncio
async def test_execute_ad_job_json_image_name_uses_first_blob_for_download(
    mock_db, mock_session_factory, mock_ad_variant, mock_campaign, mock_consumer, mock_blob_client
):
    """Multi-image products store image_name as JSON; worker must use first blob name only."""
    product = MagicMock()
    product.name = "Prod"
    product.description = "Desc"
    product.image_name = '["first.png", "second.png"]'

    with (
        patch("workers.ad_job_worker.worker._get_session_factory", return_value=mock_session_factory),
        patch("workers.ad_job_worker.worker.create_ad_variant", return_value=mock_ad_variant),
        patch("workers.ad_job_worker.worker.update_ad_variant"),
        patch("workers.ad_job_worker.worker.get_campaign", return_value=mock_campaign),
        patch("workers.ad_job_worker.worker.get_consumer", return_value=mock_consumer),
        patch("workers.ad_job_worker.worker.get_product", return_value=product),
        patch("workers.ad_job_worker.worker.BlobClient") as blob_cls,
        patch("workers.ad_job_worker.worker.evaluate_script", new_callable=AsyncMock, return_value=_PASS_MODERATION),
        patch("workers.ad_job_worker.worker.generate_ad_script", new_callable=AsyncMock, return_value="S"),
        patch("workers.ad_job_worker.worker.generate_ad_video", new_callable=AsyncMock, return_value=b"v"),
    ):
        blob_cls.from_connection_string.return_value = mock_blob_client
        await execute_ad_job(campaign_id=1, product_id=1, consumer_id=1, version_number=1)

    product_calls = [
        c
        for c in blob_cls.from_connection_string.call_args_list
        if len(c) > 1 and c[1].get("container_name") == "product-images"
    ]
    assert product_calls
    assert product_calls[0][1]["blob_name"] == "first.png"


# ---------------------------------------------------------------------------
# Tests — generate_campaign_preview, generate_campaign_ad_variants
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_generate_campaign_preview_returns_list_of_ad_variant_ids():
    """Plan-driven preview: match persona_groups from approved brief JSON; one variant per distinct consumer (capped)."""
    mock_db = MagicMock()
    mock_factory = MagicMock(return_value=mock_db)
    mock_campaign = MagicMock()
    mock_campaign.business_client_id = 42
    mock_campaign.brief = json.dumps({
        "1": {
            "plan_message": (
                "```json\n"
                '{"persona_groups":[{"name":"Trail Fans","variant_count":3}]}'
                "\n```"
            ),
        },
    })
    mock_persona = MagicMock()
    mock_persona.id = "persona-uuid-1"
    mock_persona.name = "Trail Fans"
    mock_consumer = MagicMock()
    mock_consumer.id = 10
    mock_consumer.business_client_id = 42
    with (
        patch("workers.ad_job_worker.worker._get_session_factory", return_value=mock_factory),
        patch("workers.ad_job_worker.worker.get_campaign", return_value=mock_campaign),
        patch(
            "workers.ad_job_worker.worker.load_all_personas",
            return_value=[mock_persona],
        ),
        patch(
            "workers.ad_job_worker.worker.get_consumers_by_persona_id",
            return_value=[mock_consumer],
        ),
        patch("workers.ad_job_worker.worker.execute_ad_job", new_callable=AsyncMock, return_value=99),
    ):
        result = await generate_campaign_preview(campaign_id=1, product_id=1, version_number=1)
    assert result == [99]
    mock_db.close.assert_called_once()


@pytest.mark.asyncio
async def test_generate_campaign_preview_returns_empty_when_plan_groups_yield_no_variants():
    """Non-empty persona_groups but zero variants — fail-closed; no legacy random fallback."""
    mock_db = MagicMock()
    mock_factory = MagicMock(return_value=mock_db)
    mock_campaign = MagicMock()
    mock_campaign.business_client_id = 42
    mock_campaign.brief = json.dumps({
        "1": {
            "plan_message": (
                "```json\n"
                '{"persona_groups":[{"name":"Trail Fans","variant_count":3}]}'
                "\n```"
            ),
        },
    })
    mock_persona = MagicMock()
    mock_persona.id = "persona-uuid-1"
    mock_persona.name = "Trail Fans"
    with (
        patch("workers.ad_job_worker.worker._get_session_factory", return_value=mock_factory),
        patch("workers.ad_job_worker.worker.get_campaign", return_value=mock_campaign),
        patch(
            "workers.ad_job_worker.worker.load_all_personas",
            return_value=[mock_persona],
        ),
        patch(
            "workers.ad_job_worker.worker.get_consumers_by_persona_id",
            return_value=[],
        ),
        patch("workers.ad_job_worker.worker.execute_ad_job", new_callable=AsyncMock) as mock_exec,
    ):
        result = await generate_campaign_preview(campaign_id=1, product_id=1, version_number=1)
    assert result == []
    mock_exec.assert_not_called()
    mock_db.close.assert_called_once()


@pytest.mark.asyncio
async def test_generate_campaign_ad_variants_returns_batch_id_when_there_are_consumers_to_generate():
    """generate_campaign_ad_variants creates a batch and jobs, returns batch ID."""
    mock_db = MagicMock()
    mock_factory = MagicMock(return_value=mock_db)
    mock_campaign = MagicMock()
    mock_campaign.business_client_id = 7
    mock_campaign.brief = None
    mock_consumer = MagicMock()
    mock_consumer.id = 5
    mock_consumer.business_client_id = 7
    mock_consumer.primary_persona_id = None
    mock_batch = MagicMock()
    batch_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    mock_batch.id = batch_id
    with (
        patch("workers.ad_job_worker.worker._get_session_factory", return_value=mock_factory),
        patch("workers.ad_job_worker.worker.get_campaign", return_value=mock_campaign),
        patch("workers.ad_job_worker.worker.get_all_consumers", return_value=[mock_consumer]),
        patch("workers.ad_job_worker.worker.get_ad_variant_by_campaign_consumer_version", return_value=None),
        patch("workers.ad_job_worker.worker.create_ad_job_batch", return_value=mock_batch),
        patch("workers.ad_job_worker.worker.create_ad_job"),
    ):
        result = await generate_campaign_ad_variants(campaign_id=1, product_id=1, version_number=1)
    assert result == batch_id
    mock_db.close.assert_called_once()


@pytest.mark.asyncio
async def test_generate_campaign_ad_variants_returns_none_when_plan_groups_unmatched():
    """Fail-closed: plan lists persona_groups but none match dbo.personas — no batch, no fallback."""
    mock_db = MagicMock()
    mock_factory = MagicMock(return_value=mock_db)
    mock_campaign = MagicMock()
    mock_campaign.business_client_id = 7
    mock_campaign.brief = '{"1": {"plan_message": "```json\\n{}\\n```"}}'
    with (
        patch("workers.ad_job_worker.worker._get_session_factory", return_value=mock_factory),
        patch("workers.ad_job_worker.worker.get_campaign", return_value=mock_campaign),
        patch(
            "workers.ad_job_worker.worker.parse_plan_json_from_message",
            return_value={"persona_groups": [{"name": "Unknown Persona"}]},
        ),
        patch(
            "workers.ad_job_worker.worker.resolve_persona_ids_from_plan",
            return_value=set(),
        ),
        patch("workers.ad_job_worker.worker.create_ad_job_batch") as mock_batch,
        patch("workers.ad_job_worker.worker.create_ad_job") as mock_job,
    ):
        result = await generate_campaign_ad_variants(campaign_id=1, product_id=1, version_number=1)
    assert result is None
    mock_batch.assert_not_called()
    mock_job.assert_not_called()
    mock_db.close.assert_called_once()


@pytest.mark.asyncio
async def test_generate_campaign_ad_variants_returns_none_when_no_consumers_need_generation():
    """generate_campaign_ad_variants returns None when every consumer already has an ad variant."""
    mock_db = MagicMock()
    mock_factory = MagicMock(return_value=mock_db)
    mock_campaign = MagicMock()
    mock_campaign.business_client_id = 7
    mock_campaign.brief = None
    mock_consumer = MagicMock()
    mock_consumer.business_client_id = 7
    mock_existing = MagicMock()
    with (
        patch("workers.ad_job_worker.worker._get_session_factory", return_value=mock_factory),
        patch("workers.ad_job_worker.worker.get_campaign", return_value=mock_campaign),
        patch("workers.ad_job_worker.worker.get_all_consumers", return_value=[mock_consumer]),
        patch("workers.ad_job_worker.worker.get_ad_variant_by_campaign_consumer_version", return_value=mock_existing),
    ):
        result = await generate_campaign_ad_variants(campaign_id=1, product_id=1, version_number=1)
    assert result is None
    mock_db.close.assert_called_once()
