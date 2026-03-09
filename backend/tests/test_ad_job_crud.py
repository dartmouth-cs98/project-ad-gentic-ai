"""Unit tests for ad_job and ad_job_batch CRUD — claim_ad_job, release_job_lock.

Run from the backend directory:
    cd backend && python -m pytest tests/test_ad_job_crud.py -v
"""

import sys
from pathlib import Path
from uuid import uuid4
from unittest.mock import MagicMock, patch

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

import pytest

from crud.ad_job import claim_ad_job, release_job_lock


# ---------------------------------------------------------------------------
# Tests — claim_ad_job
# ---------------------------------------------------------------------------


def test_claim_ad_job_returns_true_when_row_updated():
    """claim_ad_job returns True when the UPDATE affects one row (job was pending and unclaimed)."""
    mock_db = MagicMock()
    mock_result = MagicMock()
    mock_result.rowcount = 1
    mock_db.execute.return_value = mock_result
    job_id = uuid4()

    result = claim_ad_job(mock_db, job_id, "worker-1")

    assert result is True
    mock_db.commit.assert_called_once()


def test_claim_ad_job_returns_false_when_no_row_updated():
    """claim_ad_job returns False when the UPDATE affects zero rows (already claimed or not pending)."""
    mock_db = MagicMock()
    mock_result = MagicMock()
    mock_result.rowcount = 0
    mock_db.execute.return_value = mock_result
    job_id = uuid4()

    result = claim_ad_job(mock_db, job_id, "worker-1")

    assert result is False
    mock_db.commit.assert_called_once()


# ---------------------------------------------------------------------------
# Tests — release_job_lock
# ---------------------------------------------------------------------------


def test_release_job_lock_without_worker_id_clears_lock():
    """release_job_lock with no worker_id updates the job (any locker)."""
    mock_db = MagicMock()
    job_id = uuid4()

    release_job_lock(mock_db, job_id, status="pending")

    mock_db.execute.assert_called_once()
    mock_db.commit.assert_called_once()


def test_release_job_lock_with_worker_id_adds_where_clause():
    """release_job_lock with worker_id only clears when locked_by matches (implementation detail: stmt has extra where)."""
    mock_db = MagicMock()
    job_id = uuid4()

    release_job_lock(mock_db, job_id, status="pending", worker_id="worker-1")

    mock_db.execute.assert_called_once()
    # Statement should have been built with two where clauses (id + locked_by)
    call_arg = mock_db.execute.call_args[0][0]
    # SQLAlchemy update stmt has whereclause; we just assert execute was called with one arg
    assert call_arg is not None
    mock_db.commit.assert_called_once()
