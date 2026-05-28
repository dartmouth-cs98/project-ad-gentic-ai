"""Tests for Sync Labs client wrapper (mocked Sync SDK)."""

import sys
from pathlib import Path

import pytest

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

from services.sync_labs.client import (
    SyncLabsError,
    create_lipsync_generation,
    wait_for_generation,
)


@pytest.fixture
def sync_env(monkeypatch):
    monkeypatch.setenv("SYNC_API_KEY", "test-sync-key")
    monkeypatch.setenv("SYNC_API_BASE_URL", "https://api.sync.so")


@pytest.mark.asyncio
async def test_create_lipsync_generation_returns_id(sync_env):
    class _Gen:
        id = "gen-1"
        status = "PENDING"
        output_url = None
        error = None
        error_code = None

    class _Generations:
        async def create(self, *, model, input, options):  # noqa: A002
            assert model == "sync-3"
            assert len(input) == 2
            return _Gen()

    class _Client:
        generations = _Generations()

    gen_id = await create_lipsync_generation(
        video_url="https://example.com/v.mp4",
        audio_url="https://example.com/a.wav",
        sync_client=_Client(),
    )
    assert gen_id == "gen-1"


@pytest.mark.asyncio
async def test_wait_for_generation_completed(sync_env, monkeypatch):
    monkeypatch.setenv("SYNC_LIPSYNC_POLL_INTERVAL_SECONDS", "0")
    monkeypatch.setenv("SYNC_LIPSYNC_MAX_POLL_ATTEMPTS", "5")
    calls = {"n": 0}

    class _Gen:
        def __init__(self, *, status: str, output_url: str | None = None, error: str | None = None):
            self.id = "gen-1"
            self.status = status
            self.output_url = output_url
            self.error = error
            self.error_code = None

    class _Generations:
        async def get(self, _id: str):
            calls["n"] += 1
            if calls["n"] == 1:
                return _Gen(status="PROCESSING")
            return _Gen(status="COMPLETED", output_url="https://cdn.example.com/out.mp4")

    class _Client:
        generations = _Generations()

    url = await wait_for_generation("gen-1", sync_client=_Client())
    assert url == "https://cdn.example.com/out.mp4"


@pytest.mark.asyncio
async def test_get_generation_failed_raises(sync_env):
    class _Gen:
        id = "gen-1"
        status = "FAILED"
        output_url = None
        error = "bad input"
        error_code = None

    class _Generations:
        async def get(self, _id: str):
            return _Gen()

    class _Client:
        generations = _Generations()

    with pytest.raises(SyncLabsError, match="failed"):
        await wait_for_generation("gen-1", sync_client=_Client())
