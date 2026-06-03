"""Normalize product display names (Shopify variants, default titles)."""

from __future__ import annotations

import re

from services.brand_import.product_dedupe import canonical_product_slug, slug_from_product_url

_DEFAULT_TITLE_SUFFIX = re.compile(
    r"\s*(?:[—–\-|]\s*)?default(?:\s+title)?\s*$",
    re.IGNORECASE,
)


def _title_case_words(text: str) -> str:
    return " ".join(word.capitalize() for word in text.split())


def _looks_like_variant_shade_suffix(extra: list[str]) -> bool:
    """True for Shopify shade tokens (e.g. 03, sunbed), not product line words (e.g. Pro)."""
    if not extra:
        return False
    if any(word.isdigit() for word in extra):
        return True
    if len(extra) >= 2 and all(word.islower() for word in extra):
        return True
    if len(extra) == 1 and extra[0].islower() and len(extra[0]) > 3:
        return True
    return False


def clean_product_display_name(name: str, product_url: str | None = None) -> str:
    """
    Strip Shopify variant noise from a product title.

    Examples:
      "highlight milk 03 — Default Title" -> "Highlight Milk"
      "peptide lip tint macadamia butter" + /products/peptide-lip-tint -> "Peptide Lip Tint"
    """
    cleaned = name.strip()
    if not cleaned:
        return cleaned

    cleaned = _DEFAULT_TITLE_SUFFIX.sub("", cleaned).strip()
    cleaned = re.sub(r"\s+", " ", cleaned)
    cleaned = re.sub(r"\s+\d{1,3}$", "", cleaned).strip()

    slug = canonical_product_slug(product_url, cleaned) or slug_from_product_url(product_url)
    if not slug:
        return cleaned

    base_words = [w for w in slug.replace("-", " ").split() if w]
    if not base_words:
        return cleaned

    name_words = cleaned.lower().split()
    base_lower = [w.lower() for w in base_words]

    if name_words[: len(base_lower)] == base_lower and len(name_words) > len(base_lower):
        extra = name_words[len(base_lower) :]
        if _looks_like_variant_shade_suffix(extra):
            return _title_case_words(" ".join(base_words))
        return cleaned

    if name_words == base_lower and (cleaned.islower() or cleaned.isupper()):
        return _title_case_words(" ".join(base_words))

    return cleaned


def product_base_name_from_json_ld(node: dict, product_url: str | None) -> str | None:
    """Prefer parent product name when JSON-LD marks a variant."""
    variant_of = node.get("isVariantOf")
    if isinstance(variant_of, dict):
        parent_name = variant_of.get("name")
        if isinstance(parent_name, str) and parent_name.strip():
            return clean_product_display_name(parent_name.strip(), product_url)
    return None
