"""Unit tests for ad job poller — _process_one_job (parse-before-claim, success, failure).

Run from the backend directory:
    cd backend && python -m pytest tests/test_ad_job_poller.py -v
"""

import json
import sys
from pathlib import Path
from uuid import uuid4
from unittest.mock import AsyncMock, MagicMock, patch

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

import pytest

# Poller imports worker which needs azure; skip tests if not installed
pytest.importorskip("azure.storage.blob", reason="azure-storage-blob required for poller (worker dependency)")
import services.ad_job_poller.service as _poller_module  # load so patch("...service.claim_ad_job") resolves


# ---------------------------------------------------------------------------
# Tests — _process_one_job: parse before claim
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_process_one_job_invalid_input_marks_failed_without_claiming():
    """When input_json is invalid, job is marked failed and batch failed_delta is incremented; claim is never called."""
    job_id = uuid4()
    batch_id = uuid4()
    invalid_input = "not valid json"
    worker_id = "worker-1"
    mock_db = MagicMock()
    mock_factory = MagicMock(return_value=mock_db)

    with (
        patch.object(_poller_module, "_get_session_factory", return_value=mock_factory),
        patch.object(_poller_module, "update_ad_job") as mock_update,
        patch.object(_poller_module, "increment_ad_job_batch_progress") as mock_inc,
        patch.object(_poller_module, "claim_ad_job") as mock_claim,
        patch.object(_poller_module, "execute_ad_job", new_callable=AsyncMock),
    ):
        await _poller_module._process_one_job(job_id, batch_id, invalid_input, worker_id)

    mock_update.assert_called_once()
    call_args = mock_update.call_args
    assert call_args[0][1] == job_id
    update_data = call_args[0][2]
    assert update_data.status == "failed"
    assert "Invalid input_json" in (update_data.error_message or "")
    mock_inc.assert_called_once_with(mock_db, batch_id, failed_delta=1)
    mock_claim.assert_not_called()


@pytest.mark.asyncio
async def test_process_one_job_missing_keys_marks_failed_without_claiming():
    """When input_json is valid JSON but missing required keys, job is marked failed and batch incremented."""
    job_id = uuid4()
    batch_id = uuid4()
    incomplete_input = json.dumps({"campaign_id": 1})  # missing product_id, consumer_id
    worker_id = "worker-1"
    mock_db = MagicMock()
    mock_factory = MagicMock(return_value=mock_db)

    with (
        patch.object(_poller_module, "_get_session_factory", return_value=mock_factory),
        patch.object(_poller_module, "update_ad_job") as mock_update,
        patch.object(_poller_module, "increment_ad_job_batch_progress") as mock_inc,
        patch.object(_poller_module, "claim_ad_job") as mock_claim,
    ):
        await _poller_module._process_one_job(job_id, batch_id, incomplete_input, worker_id)

    mock_update.assert_called_once()
    assert mock_update.call_args[0][2].status == "failed"
    mock_inc.assert_called_once_with(mock_db, batch_id, failed_delta=1)
    mock_claim.assert_not_called()


# ---------------------------------------------------------------------------
# Tests — _process_one_job: success path
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_process_one_job_success_updates_job_and_increments_batch_succeeded():
    """Valid input, claim succeeds, execute_ad_job succeeds -> job completed, batch succeeded_delta=1."""
    job_id = uuid4()
    batch_id = uuid4()
    input_json = json.dumps({
        "campaign_id": 1,
        "product_id": 2,
        "consumer_id": 3,
        "version_number": 1,
    })
    worker_id = "worker-1"
    mock_db = MagicMock()
    mock_factory = MagicMock(return_value=mock_db)

    with (
        patch.object(_poller_module, "_get_session_factory", return_value=mock_factory),
        patch.object(_poller_module, "claim_ad_job", return_value=True),
        patch.object(_poller_module, "update_ad_job") as mock_update,
        patch.object(_poller_module, "increment_ad_job_batch_progress") as mock_inc,
        patch.object(_poller_module, "execute_ad_job", new_callable=AsyncMock, return_value=42),
    ):
        await _poller_module._process_one_job(job_id, batch_id, input_json, worker_id)

    mock_update.assert_called_once()
    update_data = mock_update.call_args[0][2]
    assert update_data.status == "completed"
    assert update_data.output_json == json.dumps({"ad_variant_id": 42})
    mock_inc.assert_called_once_with(mock_db, batch_id, succeeded_delta=1)


# ---------------------------------------------------------------------------
# Tests — _process_one_job: execution failure path
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_process_one_job_execution_failure_marks_failed_and_increments_batch_failed():
    """Claim succeeds but execute_ad_job raises -> job status failed, batch failed_delta=1."""
    job_id = uuid4()
    batch_id = uuid4()
    input_json = json.dumps({
        "campaign_id": 1,
        "product_id": 2,
        "consumer_id": 3,
        "version_number": 1,
    })
    worker_id = "worker-1"
    mock_db = MagicMock()
    mock_factory = MagicMock(return_value=mock_db)

    with (
        patch.object(_poller_module, "_get_session_factory", return_value=mock_factory),
        patch.object(_poller_module, "claim_ad_job", return_value=True),
        patch.object(_poller_module, "update_ad_job") as mock_update,
        patch.object(_poller_module, "increment_ad_job_batch_progress") as mock_inc,
        patch.object(
            _poller_module,
            "execute_ad_job",
            new_callable=AsyncMock,
            side_effect=RuntimeError("Video API error"),
        ),
        patch.object(_poller_module, "release_job_lock"),
    ):
        await _poller_module._process_one_job(job_id, batch_id, input_json, worker_id)

    mock_update.assert_called_once()
    update_data = mock_update.call_args[0][2]
    assert update_data.status == "failed"
    assert "Video API error" in (update_data.error_message or "")
    mock_inc.assert_called_once_with(mock_db, batch_id, failed_delta=1)


@pytest.mark.asyncio
async def test_process_one_job_not_claimed_skips_without_update():
    """When claim_ad_job returns False, no update or increment is called."""
    job_id = uuid4()
    batch_id = uuid4()
    input_json = json.dumps({
        "campaign_id": 1,
        "product_id": 2,
        "consumer_id": 3,
    })
    worker_id = "worker-1"
    mock_db = MagicMock()
    mock_factory = MagicMock(return_value=mock_db)

    with (
        patch.object(_poller_module, "_get_session_factory", return_value=mock_factory),
        patch.object(_poller_module, "claim_ad_job", return_value=False),
        patch.object(_poller_module, "update_ad_job") as mock_update,
        patch.object(_poller_module, "increment_ad_job_batch_progress") as mock_inc,
        patch.object(_poller_module, "execute_ad_job", new_callable=AsyncMock),
    ):
        await _poller_module._process_one_job(job_id, batch_id, input_json, worker_id)

    mock_update.assert_not_called()
    mock_inc.assert_not_called()
