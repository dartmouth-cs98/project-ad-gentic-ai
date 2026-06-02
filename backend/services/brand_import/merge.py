"""Merge JSON-LD seeds with LLM extraction output."""

from __future__ import annotations

import re

from schemas.brand_import import (
    BrandExtract,
    BrandImportPreview,
    FaqExtract,
    ImageCandidate,
    PricingExtract,
    ProductExtract,
    TestimonialExtract,
)
from services.brand_import.config import brand_import_max_images_per_product
from services.brand_import.image_discovery import infer_linked_product_slug
from services.brand_import.product_dedupe import canonical_product_slug
from services.brand_import.product_dedupe import (
    is_weak_product_url,
    product_url_rank,
    products_match,
)
from services.brand_import.product_images import reconcile_product_image_candidates
from services.brand_import.product_name import clean_product_display_name
from services.brand_import.structured_data import StructuredProductHint, StructuredSiteHints


def _norm_name(name: str) -> str:
    return re.sub(r"\s+", " ", name.strip().lower())


def structured_hint_to_product_extract(hint: StructuredProductHint) -> ProductExtract:
    pricing = None
    if hint.price_display or hint.price_amount is not None:
        pricing = PricingExtract(
            display=hint.price_display,
            amount=hint.price_amount,
            currency=hint.price_currency,
        )
    product_url = hint.url
    return ProductExtract(
        name=clean_product_display_name(hint.name, product_url),
        description=hint.description,
        product_url=product_url,
        value_propositions=[],
        pricing=pricing,
        offers=[],
        image_candidates=[
            ImageCandidate(
                url=u,
                alt=None,
                linked_product_slug=infer_linked_product_slug(hint.url or "", u)
                or canonical_product_slug(hint.url, hint.name),
            )
            for u in hint.image_urls[: brand_import_max_images_per_product()]
            if u
        ],
    )


def seed_products_from_structured(
    site: StructuredSiteHints,
    *,
    require_image: bool = False,
) -> list[ProductExtract]:
    """Build product rows from JSON-LD (name required; image optional unless require_image)."""
    seeded: list[ProductExtract] = []
    for hint in site.products:
        if not hint.name.strip():
            continue
        if require_image and not hint.image_urls:
            continue
        seeded.append(structured_hint_to_product_extract(hint))
    return seeded


def merge_brand_fields(brand: BrandExtract, site: StructuredSiteHints) -> BrandExtract:
    updates: dict = {}
    if not brand.name and site.organization_name:
        updates["name"] = site.organization_name
    if not brand.faqs and site.faqs:
        updates["faqs"] = [
            FaqExtract(question=f.question, answer=f.answer) for f in site.faqs[:20]
        ]
    if not brand.testimonials and site.reviews:
        updates["testimonials"] = [
            TestimonialExtract(quote=r.quote, attribution=r.attribution)
            for r in site.reviews[:15]
        ]
    if not updates:
        return brand
    return brand.model_copy(update=updates)


def _pick_better_url(current: str | None, candidate: str | None) -> str | None:
    if is_weak_product_url(current) and not is_weak_product_url(candidate):
        return candidate
    if is_weak_product_url(candidate):
        return current
    if product_url_rank(candidate) > product_url_rank(current):
        return candidate
    return current


def _merge_two_products(primary: ProductExtract, secondary: ProductExtract) -> ProductExtract:
    """Merge secondary into primary; primary (structured seed) keeps pricing when set."""
    better_url = _pick_better_url(primary.product_url, secondary.product_url)
    pricing = primary.pricing
    if pricing is None or pricing.amount is None:
        pricing = secondary.pricing or pricing

    description = primary.description or secondary.description
    if secondary.description and (
        not description or len(secondary.description) > len(description)
    ):
        description = secondary.description

    display_name = clean_product_display_name(primary.name, better_url)
    alt_name = clean_product_display_name(secondary.name, better_url)
    if alt_name and (
        not display_name
        or (len(alt_name) < len(display_name) and products_match(display_name, better_url, alt_name, better_url))
    ):
        display_name = alt_name

    return primary.model_copy(
        update={
            "name": display_name,
            "product_url": better_url,
            "description": description,
            "value_propositions": primary.value_propositions or secondary.value_propositions,
            "offers": primary.offers or secondary.offers,
            "pricing": pricing,
            # Keep structured images only; LLM often assigns the same homepage carousel to all products.
            "image_candidates": list(primary.image_candidates),
        }
    )


def merge_products(
    structured_seeds: list[ProductExtract],
    llm_products: list[ProductExtract],
) -> list[ProductExtract]:
    """Structured seeds first; dedupe by name/slug; structured pricing wins on match."""
    merged: list[ProductExtract] = []

    for product in structured_seeds + llm_products:
        match_index: int | None = None
        for i, existing in enumerate(merged):
            if products_match(
                existing.name,
                existing.product_url,
                product.name,
                product.product_url,
            ):
                match_index = i
                break
        if match_index is None:
            merged.append(product)
        else:
            # Seeds are processed before LLM rows; keep structured pricing on merge.
            merged[match_index] = _merge_two_products(merged[match_index], product)

    return merged


def merge_preview_with_structured(
    preview: BrandImportPreview,
    site: StructuredSiteHints,
    *,
    structured_product_count: int,
    pages: list | None = None,
) -> BrandImportPreview:
    seeds = seed_products_from_structured(site, require_image=False)
    merged_products = merge_products(seeds, preview.products)
    if pages:
        merged_products = reconcile_product_image_candidates(pages, merged_products)
    merged_brand = merge_brand_fields(preview.brand, site)

    warnings = list(preview.warnings)
    if structured_product_count > 0:
        warnings.append(
            f"Merged {structured_product_count} product(s) from JSON-LD structured data."
        )
    deduped = len(seeds) + len(preview.products) - len(merged_products)
    if deduped > 0:
        warnings.append(f"Removed {deduped} duplicate product(s) during merge.")

    confidence = preview.confidence
    if seeds and confidence == "low":
        confidence = "medium"

    return preview.model_copy(
        update={
            "brand": merged_brand,
            "products": merged_products,
            "warnings": warnings,
            "confidence": confidence,
        }
    )
