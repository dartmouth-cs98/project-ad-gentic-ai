"""Helpers for parsing ad_jobs.input_json."""

from __future__ import annotations

import json


def campaign_id_from_job_input(input_json: str) -> int | None:
    """Best-effort ``campaign_id`` for credit refunds when full parse fails."""
    try:
        data = json.loads(input_json)
        return int(data["campaign_id"])
    except (json.JSONDecodeError, KeyError, TypeError, ValueError):
        return None
