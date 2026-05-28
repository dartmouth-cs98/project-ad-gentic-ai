"""Environment configuration for Sync Labs lip sync."""

from __future__ import annotations

import json
import logging
import os
from typing import Any

logger = logging.getLogger(__name__)

DEFAULT_SYNC_BASE_URL = "https://api.sync.so"
DEFAULT_SYNC_MODEL = "sync-3"
DEFAULT_SYNC_MODE = "remap"
DEFAULT_POLL_INTERVAL_SECONDS = 5
DEFAULT_MAX_POLL_ATTEMPTS = 120


def _env_truthy(name: str) -> bool:
    return os.getenv(name, "").strip().lower() in ("1", "true", "yes", "on")


def sync_lipsync_enabled() -> bool:
    return _env_truthy("SYNC_LIPSYNC_ENABLED")


def sync_api_key() -> str:
    return os.getenv("SYNC_API_KEY", "").strip()


def sync_base_url() -> str:
    return os.getenv("SYNC_API_BASE_URL", DEFAULT_SYNC_BASE_URL).strip().rstrip("/")


def sync_lipsync_model() -> str:
    return os.getenv("SYNC_LIPSYNC_MODEL", DEFAULT_SYNC_MODEL).strip() or DEFAULT_SYNC_MODEL


def sync_lipsync_sync_mode() -> str:
    return os.getenv("SYNC_LIPSYNC_SYNC_MODE", DEFAULT_SYNC_MODE).strip() or DEFAULT_SYNC_MODE


def sync_lipsync_poll_interval_seconds() -> int:
    raw = os.getenv("SYNC_LIPSYNC_POLL_INTERVAL_SECONDS", str(DEFAULT_POLL_INTERVAL_SECONDS)).strip()
    try:
        return max(1, int(raw))
    except ValueError:
        return DEFAULT_POLL_INTERVAL_SECONDS


def sync_lipsync_max_poll_attempts() -> int:
    raw = os.getenv("SYNC_LIPSYNC_MAX_POLL_ATTEMPTS", str(DEFAULT_MAX_POLL_ATTEMPTS)).strip()
    try:
        return max(1, int(raw))
    except ValueError:
        return DEFAULT_MAX_POLL_ATTEMPTS


def sync_lipsync_extra_options() -> dict[str, Any]:
    raw = os.getenv("SYNC_LIPSYNC_OPTIONS", "").strip()
    if not raw:
        return {}
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as exc:
        logger.warning("SYNC_LIPSYNC_OPTIONS is not valid JSON: %s", exc)
        return {}
    if not isinstance(parsed, dict):
        logger.warning("SYNC_LIPSYNC_OPTIONS must be a JSON object")
        return {}
    return parsed


def sync_lipsync_env_skip_reason() -> str | None:
    """Env/config reason Sync cannot run, or ``None`` if env gates pass."""
    if not sync_lipsync_enabled():
        return "SYNC_LIPSYNC_ENABLED is off"
    if not sync_api_key():
        return "SYNC_API_KEY is missing"
    return None


def should_run_sync_lipsync(meta: dict[str, Any] | None = None) -> bool:
    """True when Sync lipsync is enabled, configured, and ``meta.lip_sync_risk`` is true."""
    return sync_lipsync_skip_reason(meta) is None


def sync_lipsync_skip_reason(meta: dict[str, Any] | None = None) -> str | None:
    """Human-readable reason Sync lipsync will not run, or ``None`` if it will."""
    env_reason = sync_lipsync_env_skip_reason()
    if env_reason:
        return env_reason
    if not meta or not meta.get("lip_sync_risk"):
        return "lip_sync_risk is false or absent on variant meta"
    return None
