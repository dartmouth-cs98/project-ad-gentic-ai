"""Poller that periodically claims and processes jobs from the ad_jobs table."""

import asyncio
import json
import logging
import os
import socket
from uuid import UUID

from database import _get_session_factory
from crud.ad_job import (
    get_pending_ad_jobs,
    claim_ad_job,
    update_ad_job,
    release_job_lock,
)
from crud.ad_job_batch import increment_ad_job_batch_progress
from schemas.ad_job import AdJobUpdate
from workers.ad_job_worker.worker import execute_ad_job

logger = logging.getLogger(__name__)

# Default: poll every 5 seconds, max 3 attempts per job
POLL_INTERVAL_SECONDS = float(os.environ.get("AD_JOB_POLL_INTERVAL_SECONDS", "5"))
MAX_ATTEMPTS = int(os.environ.get("AD_JOB_MAX_ATTEMPTS", "3"))


def _worker_id() -> str:
    """Unique identifier for this poller process (e.g. hostname:pid)."""
    return f"{socket.gethostname()}:{os.getpid()}"


def _parse_input(input_json: str) -> dict:
    """Parse input_json from an ad_job. Expected keys: campaign_id, product_id, consumer_id, version_number."""
    data = json.loads(input_json)
    return {
        "campaign_id": int(data["campaign_id"]),
        "product_id": int(data["product_id"]),
        "consumer_id": int(data["consumer_id"]),
        "version_number": int(data.get("version_number", 1)),
    }


async def _process_one_job(job_id: UUID, batch_id: UUID, input_json: str, worker_id: str) -> None:
    """Parse input before claim so invalid jobs are marked failed without claiming or incrementing attempt_count."""
    try:
        payload = _parse_input(input_json)
    except (json.JSONDecodeError, KeyError, TypeError, ValueError) as e:
        logger.warning("Job %s invalid input_json: %s", job_id, e)
        factory = _get_session_factory()
        db = factory()
        try:
            updated = update_ad_job(
                db,
                job_id,
                AdJobUpdate(
                    status="failed",
                    error_message=f"Invalid input_json: {e!s}"[:65535],
                ),
            )
            if updated is not None:
                increment_ad_job_batch_progress(db, batch_id, failed_delta=1)
        finally:
            db.close()
        return

    factory = _get_session_factory()
    db = factory()
    try:
        claimed = claim_ad_job(db, job_id, worker_id)
        if not claimed:
            logger.debug("Job %s was already claimed, skipping", job_id)
            return

        logger.info("Processing ad_job %s: campaign_id=%s consumer_id=%s", job_id, payload["campaign_id"], payload["consumer_id"])

        try:
            ad_variant_id = await execute_ad_job(
                campaign_id=payload["campaign_id"],
                product_id=payload["product_id"],
                consumer_id=payload["consumer_id"],
                version_number=payload["version_number"],
            )
            update_ad_job(
                db,
                job_id,
                AdJobUpdate(
                    status="completed",
                    output_json=json.dumps({"ad_variant_id": ad_variant_id}),
                    locked_at=None,
                    locked_by=None,
                ),
            )
            increment_ad_job_batch_progress(db, batch_id, succeeded_delta=1)
            logger.info("Completed ad_job %s -> ad_variant_id=%s", job_id, ad_variant_id)
        except Exception as e:
            logger.exception("Ad job %s failed: %s", job_id, e)
            update_ad_job(
                db,
                job_id,
                AdJobUpdate(
                    status="failed",
                    error_message=str(e)[:65535],
                    locked_at=None,
                    locked_by=None,
                ),
            )
            increment_ad_job_batch_progress(db, batch_id, failed_delta=1)
    except Exception as e:
        logger.exception("Poller error for job %s: %s", job_id, e)
        try:
            release_job_lock(db, job_id, status="pending", worker_id=worker_id)
        except Exception:
            pass
    finally:
        db.close()


async def run_poller(
    *,
    poll_interval_seconds: float = POLL_INTERVAL_SECONDS,
    max_attempts: int = MAX_ATTEMPTS,
    worker_id: str | None = None,
) -> None:
    """
    Run the ad_job poller loop. Polls the database for pending jobs, claims one at a time,
    runs execute_ad_job, and updates the row. Runs until the task is cancelled.
    """
    wid = worker_id or _worker_id()
    logger.info("Ad job poller started (worker_id=%s, interval=%.1fs)", wid, poll_interval_seconds)

    while True:
        try:
            factory = _get_session_factory()
            db = factory()
            try:
                pending = get_pending_ad_jobs(db, limit=1, max_attempts=max_attempts)
                if pending:
                    job = pending[0]
                    await _process_one_job(job.id, job.batch_id, job.input_json, wid)
            finally:
                db.close()
        except asyncio.CancelledError:
            logger.info("Ad job poller cancelled")
            raise
        except Exception as e:
            logger.exception("Poller cycle error: %s", e)

        await asyncio.sleep(poll_interval_seconds)
