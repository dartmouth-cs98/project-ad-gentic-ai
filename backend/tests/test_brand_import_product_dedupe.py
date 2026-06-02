"""Tests for product deduplication during brand import merge."""

from __future__ import annotations

from schemas.brand_import import BrandExtract, BrandImportPreview, PricingExtract, ProductExtract
from services.brand_import.merge import merge_preview_with_structured, merge_products
from services.brand_import.product_dedupe import canonical_product_slug, products_match
from services.brand_import.structured_data import (
    StructuredProductHint,
    StructuredSiteHints,
    aggregate_site_hints,
)


def test_canonical_slug_strips_variant_suffix():
    assert (
        canonical_product_slug(
            "https://www.rhodeskin.com/products/highlight-milk-02",
            None,
        )
        == "highlight-milk"
    )


def test_products_match_highlight_milk_variants():
    assert products_match(
        "Highlight Milk",
        "https://www.rhodeskin.com/products/highlight-milk",
        "Highlight Milk 02",
        "https://www.rhodeskin.com/products/highlight-milk-02",
    )


def test_products_match_by_normalized_name():
    assert products_match(
        "GLAZING MILK",
        "https://www.rhodeskin.com/",
        "glazing milk",
        None,
    )


def test_products_match_by_product_slug():
    assert products_match(
        "Highlight Milk",
        "https://www.rhodeskin.com/products/highlight-milk",
        "HIGHLIGHT MILK",
        "https://www.rhodeskin.com/",
    )


def test_merge_products_dedupes_homepage_and_product_page():
    seeds = [
        ProductExtract(
            name="GLAZING MILK",
            product_url="https://www.rhodeskin.com/",
            pricing=PricingExtract(display="USD 32", amount=32.0, currency="USD"),
        ),
        ProductExtract(
            name="Glazing Milk",
            product_url="https://www.rhodeskin.com/products/glazing-milk",
            description="Ceramide facial essence",
        ),
    ]
    merged = merge_products(seeds, [])
    assert len(merged) == 1
    assert merged[0].product_url == "https://www.rhodeskin.com/products/glazing-milk"
    assert merged[0].pricing is not None
    assert merged[0].pricing.amount == 32.0
    assert merged[0].description == "Ceramide facial essence"


def test_merge_products_dedupes_llm_with_structured():
    seeds = [
        ProductExtract(
            name="Peptide Lip Tint",
            product_url="https://www.rhodeskin.com/products/peptide-lip-tint",
        ),
    ]
    llm = [
        ProductExtract(name="peptide lip tint", product_url=None),
        ProductExtract(
            name="Pocket Bronze",
            product_url="https://www.rhodeskin.com/products/pocket-bronze",
        ),
    ]
    merged = merge_products(seeds, llm)
    assert len(merged) == 2
    names = {p.name.lower() for p in merged}
    assert "peptide lip tint" in names
    assert "pocket bronze" in names


def test_aggregate_site_hints_dedupes_across_pages():
    from dataclasses import dataclass

    from services.brand_import.structured_data import StructuredPageHints

    @dataclass
    class FakePage:
        url: str
        structured: StructuredPageHints

    pages = [
        FakePage(
            "https://www.rhodeskin.com/",
            StructuredPageHints(
                products=[
                    StructuredProductHint(
                        name="GLAZING MILK",
                        url="https://www.rhodeskin.com/",
                    ),
                ],
            ),
        ),
        FakePage(
            "https://www.rhodeskin.com/products/glazing-milk",
            StructuredPageHints(
                products=[
                    StructuredProductHint(
                        name="Glazing Milk",
                        url="https://www.rhodeskin.com/products/glazing-milk",
                        price_amount=32.0,
                    ),
                ],
            ),
        ),
    ]
    site = aggregate_site_hints(pages)
    assert len(site.products) == 1
    assert site.products[0].url == "https://www.rhodeskin.com/products/glazing-milk"


def test_merge_preview_warns_on_dedupe():
    site = StructuredSiteHints(
        products=[
            StructuredProductHint(
                name="Widget",
                url="https://shop.example.com/products/widget",
            ),
        ],
    )
    preview = BrandImportPreview(
        source_url="https://shop.example.com/",
        fetched_pages=[],
        brand=BrandExtract(),
        products=[ProductExtract(name="widget", product_url=None)],
        warnings=[],
        confidence="medium",
    )
    merged = merge_preview_with_structured(preview, site, structured_product_count=1)
    assert len(merged.products) == 1
    assert any("duplicate" in w.lower() for w in merged.warnings)
