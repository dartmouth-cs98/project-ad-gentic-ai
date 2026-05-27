"""Tests for Sync Labs gating and config."""

import sys
from pathlib import Path

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

from services.sync_labs.config import should_run_sync_lipsync


class TestShouldRunSyncLipsync:
    def test_false_when_disabled(self, monkeypatch):
        monkeypatch.setenv("SYNC_LIPSYNC_ENABLED", "false")
        monkeypatch.setenv("SYNC_API_KEY", "key")
        assert should_run_sync_lipsync() is False
        assert should_run_sync_lipsync({"lip_sync_risk": True}) is False

    def test_false_without_api_key(self, monkeypatch):
        monkeypatch.setenv("SYNC_LIPSYNC_ENABLED", "true")
        monkeypatch.delenv("SYNC_API_KEY", raising=False)
        assert should_run_sync_lipsync() is False
        assert should_run_sync_lipsync({"lip_sync_risk": True}) is False

    def test_false_without_lip_sync_risk(self, monkeypatch):
        monkeypatch.setenv("SYNC_LIPSYNC_ENABLED", "true")
        monkeypatch.setenv("SYNC_API_KEY", "test-key")
        assert should_run_sync_lipsync() is False
        assert should_run_sync_lipsync({}) is False
        assert should_run_sync_lipsync({"lip_sync_risk": False}) is False

    def test_true_when_enabled_and_lip_sync_risk(self, monkeypatch):
        monkeypatch.setenv("SYNC_LIPSYNC_ENABLED", "true")
        monkeypatch.setenv("SYNC_API_KEY", "test-key")
        assert should_run_sync_lipsync({"lip_sync_risk": True}) is True
