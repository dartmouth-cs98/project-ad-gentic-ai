"""LLM JSON parsing and heuristic fallback for brand import."""

import json
import sys
from pathlib import Path

import pytest

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

from services.brand_import.content_extractor import PageContent
from services.brand_import.llm_extract import heuristic_preview
from workers.ad_video_generation_worker.provider_selection import _extract_json_object


def test_extract_json_object_strips_fences():
    raw = 'Here is data:\n```json\n{"brand": {"name": "Acme"}, "products": [], "confidence": "high"}\n```'
    parsed = json.loads(_extract_json_object(raw))
    assert parsed["brand"]["name"] == "Acme"


def test_heuristic_preview_builds_product():
    pages = [
        PageContent(
            url="https://example.com",
            title="Example Co",
            text="We sell great widgets for busy professionals.",
            image_urls=["https://example.com/hero.png"],
        )
    ]
    preview = heuristic_preview("https://example.com", pages, ["warn"])
    assert preview.brand.name == "Example Co"
    assert len(preview.products) == 1
    assert preview.products[0].name == "Example Co"
    assert preview.confidence == "low"
    assert any("heuristic" in w.lower() for w in preview.warnings)
