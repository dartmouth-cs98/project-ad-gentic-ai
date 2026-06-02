"""Tests for product display name cleanup."""

from __future__ import annotations

from services.brand_import.product_name import clean_product_display_name


def test_strips_default_title_suffix():
    assert (
        clean_product_display_name(
            "the summer kit — Default Title",
            "https://www.rhodeskin.com/products/the-summer-kit",
        )
        == "The Summer Kit"
    )


def test_strips_variant_shade_using_product_url_slug():
    assert (
        clean_product_display_name(
            "highlight milk 03 — Default Title",
            "https://www.rhodeskin.com/products/highlight-milk",
        )
        == "Highlight Milk"
    )
    assert (
        clean_product_display_name(
            "pocket bronze sunbed",
            "https://www.rhodeskin.com/products/pocket-bronze",
        )
        == "Pocket Bronze"
    )
    assert (
        clean_product_display_name(
            "peptide lip tint macadamia butter — Default Title",
            "https://www.rhodeskin.com/products/peptide-lip-tint",
        )
        == "Peptide Lip Tint"
    )


def test_keeps_name_when_no_url_and_only_default_title():
    assert clean_product_display_name("Widget — Default Title", None) == "Widget"


def test_strips_variant_code_from_name_and_handle():
    assert (
        clean_product_display_name(
            "Highlight Milk 02",
            "https://www.rhodeskin.com/products/highlight-milk-02",
        )
        == "Highlight Milk"
    )


def test_keeps_product_line_word_not_in_url_slug():
    assert (
        clean_product_display_name(
            "Widget Pro",
            "https://example.com/products/widget",
        )
        == "Widget Pro"
    )
