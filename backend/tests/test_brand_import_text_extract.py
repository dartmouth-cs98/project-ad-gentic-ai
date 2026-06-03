"""Phase 2: trafilatura / readability text extraction."""

import sys
from pathlib import Path
from unittest.mock import patch

import pytest

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

_FIXTURES = Path(__file__).resolve().parent / "fixtures" / "brand_import"

from services.brand_import.content_extractor import extract_page_content
from services.brand_import.text_extract import (
    _beautifulsoup_plain_text,
    extract_main_text,
)


def _read_fixture(name: str) -> str:
    return (_FIXTURES / name).read_text(encoding="utf-8")


class TestTextExtract:
    def test_noisy_nav_trafilatura_shorter_than_plain_bs(self):
        html = _read_fixture("noisy_nav.html")
        url = "https://example.com/products"
        raw_len = len(_beautifulsoup_plain_text(html))
        result = extract_main_text(html, url)
        assert result.extractor in ("trafilatura", "beautifulsoup_stripped")
        assert result.text
        assert len(result.text) < raw_len
        assert "Widget Pro" in result.text
        assert result.raw_length == raw_len

    def test_product_jsonld_fixture_still_extracts_main_content(self):
        html = _read_fixture("product_jsonld.html")
        result = extract_main_text(html, "https://example.com/")
        assert len(result.text) >= 20
        assert "widget" in result.text.lower() or "Widget" in result.text

    def test_page_content_records_extractor(self):
        html = _read_fixture("noisy_nav.html")
        page = extract_page_content("https://example.com/", html)
        assert page.text_extractor in ("trafilatura", "beautifulsoup_stripped", "beautifulsoup")
        assert page.text_raw_length > len(page.text)
        assert "Widget Pro" in page.text

    @patch("services.brand_import.text_extract.brand_import_use_trafilatura", return_value=False)
    def test_fallback_stripped_when_trafilatura_disabled(self, _mock_off):
        html = _read_fixture("noisy_nav.html")
        result = extract_main_text(html, "https://example.com/")
        assert result.extractor in ("beautifulsoup_stripped", "beautifulsoup")
        assert len(result.text) < result.raw_length

    def test_trafilatura_missing_package_falls_back(self, monkeypatch):
        html = _read_fixture("noisy_nav.html")

        def _raise_import():
            raise ImportError("no trafilatura")

        import builtins

        real_import = builtins.__import__

        def _fake_import(name, *args, **kwargs):
            if name == "trafilatura":
                return _raise_import()
            return real_import(name, *args, **kwargs)

        monkeypatch.setattr(builtins, "__import__", _fake_import)
        result = extract_main_text(html, "https://example.com/")
        assert result.extractor in ("beautifulsoup_stripped", "beautifulsoup")
        assert result.text
