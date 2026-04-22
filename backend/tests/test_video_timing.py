"""Tests for utils.video_timing (VIDEO_SECONDS alignment)."""

import sys
from pathlib import Path

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

import pytest

from utils import video_timing


def test_allowed_video_seconds_invalid_falls_back_to_twelve(monkeypatch):
    monkeypatch.setenv("VIDEO_SECONDS", "99")
    assert video_timing.allowed_video_seconds() == 12


def test_script_block_twelve_has_expected_beats():
    body = video_timing.script_output_format_block(12)
    assert "0–12s" in body or "0–12" in body
    assert "## Beat 1 — 0–2s (hook)" in body
    assert "11.35" in body


def test_script_block_eight_matches_video_dialogue_end():
    assert video_timing.dialogue_end_seconds(8) == 7.35
    body = video_timing.script_output_format_block(8)
    assert "## Beat 4 — 6–8s (product moment)" in body
    assert "7.35" in body
    # Beat 4 action must start at Beat 4 window (6s), not Beat 3 (3s).
    assert "6–~7.35" in body
    assert "3–~7.35" not in body
