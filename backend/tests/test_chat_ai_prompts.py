"""Tests for chat strategist prompt building."""

import sys
from pathlib import Path
from types import SimpleNamespace

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

from services.chat_ai.prompts import (
    build_messages_for_completion,
    format_personas_catalog_for_prompt,
)


def test_format_personas_catalog_includes_backticked_names():
    p1 = SimpleNamespace(name="Alpha", description="First line\nSecond line")
    p2 = SimpleNamespace(name="Beta", description="x" * 400)
    out = format_personas_catalog_for_prompt([p1, p2])
    assert "`Alpha`" in out
    assert "`Beta`" in out
    assert "Second line" in out


def test_build_messages_includes_persona_library():
    msgs = build_messages_for_completion(
        conversation_history=[{"role": "user", "content": "Hi"}],
        personas_catalog="- `One` — desc",
    )
    assert msgs[1]["role"] == "system"
    assert "Persona library" in msgs[1]["content"]
    assert "`One`" in msgs[1]["content"]
