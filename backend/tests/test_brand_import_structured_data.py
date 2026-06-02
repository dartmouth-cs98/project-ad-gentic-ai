"""Structured data extraction (JSON-LD, meta) for brand import Phase 1."""

import json
import sys
from pathlib import Path

import pytest

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

_FIXTURES = Path(__file__).resolve().parent / "fixtures" / "brand_import"


from services.brand_import.content_extractor import extract_page_content
from services.brand_import.merge import merge_preview_with_structured, seed_products_from_structured
from services.brand_import.structured_data import (
    aggregate_site_hints,
    extract_meta_tags,
    extract_structured_page_hints,
    infer_page_type,
    parse_json_ld_blocks,
)


def _read_fixture(name: str) -> str:
    return (_FIXTURES / name).read_text(encoding="utf-8")


class TestJsonLdParsing:
    def test_product_fixture_parses_product(self):
        html = _read_fixture("product_jsonld.html")
        nodes = parse_json_ld_blocks(html)
        assert len(nodes) >= 2
        hints = extract_structured_page_hints(html, "https://example.com/products/widget")
        assert any(p.name == "Widget Pro" for p in hints.products)
        assert hints.organization_name == "Acme Inc"
        assert "Product" in hints.json_ld_types

    def test_product_has_price_and_image(self):
        html = _read_fixture("product_jsonld.html")
        hints = extract_structured_page_hints(html, "https://example.com/")
        product = hints.products[0]
        assert product.price_amount == pytest.approx(29.99)
        assert product.price_currency == "USD"
        assert any("widget-pro.jpg" in u for u in product.image_urls)

    def test_faq_fixture(self):
        html = _read_fixture("faq_jsonld.html")
        hints = extract_structured_page_hints(html, "https://example.com/faq")
        assert len(hints.faqs) == 1
        assert hints.faqs[0].question.startswith("What is shipping")
        assert infer_page_type("https://example.com/faq", "Help", hints) == "faq"


class TestMetaTags:
    def test_extracts_description_and_og(self):
        html = _read_fixture("product_jsonld.html")
        meta = extract_meta_tags(html, "https://example.com/")
        assert "Premium widgets" in meta.get("description", "")
        assert meta.get("og:title") == "Acme Widget Pro"
        assert "hero.jpg" in meta.get("og:image:absolute", "")


class TestPageContentIntegration:
    def test_extract_page_content_includes_structured(self):
        html = _read_fixture("product_jsonld.html")
        page = extract_page_content("https://example.com/", html)
        assert page.page_type in ("product", "home")
        assert len(page.structured.products) >= 1
        assert page.meta.get("description")

    def test_build_corpus_includes_structured_json(self):
        from services.brand_import.content_extractor import build_corpus

        html = _read_fixture("product_jsonld.html")
        page = extract_page_content("https://example.com/", html)
        corpus = build_corpus([page])
        assert "STRUCTURED_JSON" in corpus
        assert "Widget Pro" in corpus
        assert "PAGE_TYPE:" in corpus


class TestMergeStructuredSeeds:
    def test_seed_products_without_llm(self):
        html = _read_fixture("product_jsonld.html")
        page = extract_page_content("https://example.com/", html)
        site = aggregate_site_hints([page])
        seeds = seed_products_from_structured(site)
        assert len(seeds) == 1
        assert seeds[0].name == "Widget Pro"
        assert seeds[0].pricing is not None
        assert seeds[0].pricing.amount == pytest.approx(29.99)

    def test_merge_preview_adds_structured_products(self):
        from schemas.brand_import import BrandExtract, BrandImportPreview

        html = _read_fixture("product_jsonld.html")
        page = extract_page_content("https://example.com/", html)
        site = aggregate_site_hints([page])
        preview = BrandImportPreview(
            source_url="https://example.com/",
            fetched_pages=[page.url],
            brand=BrandExtract(),
            products=[],
            warnings=[],
            confidence="low",
        )
        merged = merge_preview_with_structured(preview, site, structured_product_count=len(site.products))
        assert len(merged.products) == 1
        assert merged.products[0].name == "Widget Pro"
        assert merged.brand.name == "Acme Inc"
        assert any("JSON-LD" in w for w in merged.warnings)
