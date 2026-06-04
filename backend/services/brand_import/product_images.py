"""Assign and filter product image candidates by product identity."""

from __future__ import annotations

import re
from urllib.parse import urlparse

from schemas.brand_import import ImageCandidate, ProductExtract
from services.brand_import.config import brand_import_max_images_per_product
from services.brand_import.image_discovery import DiscoveredImage, is_likely_junk_image_url
from services.brand_import.product_dedupe import (
    canonical_product_slug,
    is_weak_product_url,
    products_match,
)

_IMAGE_EXT = re.compile(r"\.(?:jpe?g|png|gif|webp|avif)(?:\?|$)", re.I)


def _image_file_stem(image_url: str) -> str:
    """Last URL path segment without extension (e.g. snap-on-lip-case-hero)."""
    segment = image_url.rstrip("/").split("/")[-1].lower()
    segment = re.sub(r"\.[a-z0-9]{2,5}$", "", segment, flags=re.I)
    return segment


def is_valid_product_image_url(url: str) -> bool:
    """Drop junk, relative, data-URI, and obvious non-image URLs."""
    if not url or not isinstance(url, str):
        return False
    trimmed = url.strip()
    if not trimmed.startswith(("http://", "https://")):
        return False
    if trimmed.startswith("data:"):
        return False
    if is_likely_junk_image_url(trimmed):
        return False
    parsed = urlparse(trimmed)
    if not parsed.netloc:
        return False
    path = parsed.path.lower()
    if path.endswith(".svg"):
        return False
    # Allow Shopify/CDN paths without extensions; require extension or /files/ or /images/
    if _IMAGE_EXT.search(trimmed):
        return True
    if any(token in path for token in ("/files/", "/images/", "/products/", "/cdn/")):
        return True
    return bool(_image_file_stem(trimmed))


def image_url_matches_product_slug(image_url: str, product_slug: str | None) -> bool:
    if not product_slug:
        return False
    slug = product_slug.lower()
    stem = _image_file_stem(image_url)
    if not stem:
        return False
    if stem == slug:
        return True
    return stem.startswith(f"{slug}-")


def _image_claimed_by_other_product(
    image_url: str,
    product_slug: str | None,
    other_slugs: list[str],
) -> bool:
    """True when a longer product handle is a better match for this image URL."""
    if not product_slug:
        return False
    for other in other_slugs:
        if other == product_slug or len(other) <= len(product_slug):
            continue
        if image_url_matches_product_slug(image_url, other):
            return True
    return False


def _candidate_from_url(url: str, product_slug: str | None, *, alt: str | None = None) -> ImageCandidate:
    return ImageCandidate(
        url=url,
        alt=alt,
        linked_product_slug=product_slug,
    )


def _structured_images_for_product(pages: list, product: ProductExtract) -> list[ImageCandidate]:
    """JSON-LD Product.image entries matched to this product row."""
    product_slug = canonical_product_slug(product.product_url, product.name)
    found: list[ImageCandidate] = []
    seen: set[str] = set()
    for page in pages:
        structured = getattr(page, "structured", None)
        if structured is None:
            continue
        for hint in getattr(structured, "products", []):
            if not products_match(
                hint.name,
                hint.url,
                product.name,
                product.product_url,
            ):
                continue
            for url in hint.image_urls:
                if url in seen or not is_valid_product_image_url(url):
                    continue
                seen.add(url)
                found.append(_candidate_from_url(url, product_slug, alt=hint.name))
    return found


def _page_images_for_product(
    pages: list,
    product_slug: str | None,
    other_slugs: list[str],
) -> list[ImageCandidate]:
    """All images from a dedicated /products/{slug} page (not homepage carousel)."""
    if not product_slug:
        return []
    found: list[ImageCandidate] = []
    seen: set[str] = set()
    for page in pages:
        page_url = getattr(page, "url", None)
        if not page_url or is_weak_product_url(page_url):
            continue
        page_slug = canonical_product_slug(page_url, None)
        if page_slug != product_slug:
            continue
        for img in getattr(page, "image_candidates", None) or []:
            if img.url in seen or not is_valid_product_image_url(img.url):
                continue
            if _image_claimed_by_other_product(img.url, product_slug, other_slugs):
                continue
            seen.add(img.url)
            found.append(_candidate_from_url(img.url, product_slug, alt=img.alt))
    return found


def _slug_matched_pool_images(
    product: ProductExtract,
    product_slug: str | None,
    other_slugs: list[str],
) -> list[ImageCandidate]:
    """Keep only pre-assigned candidates whose URL stem matches this product handle."""
    if not product_slug:
        return []
    found: list[ImageCandidate] = []
    seen: set[str] = set()
    for candidate in product.image_candidates:
        if candidate.url in seen or not is_valid_product_image_url(candidate.url):
            continue
        if not image_url_matches_product_slug(candidate.url, product_slug):
            continue
        if _image_claimed_by_other_product(candidate.url, product_slug, other_slugs):
            continue
        seen.add(candidate.url)
        found.append(
            candidate.model_copy(update={"linked_product_slug": product_slug}),
        )
    return found


def reconcile_product_image_candidates(
    pages: list,
    products: list[ProductExtract],
) -> list[ProductExtract]:
    """
    Build per-product image lists from JSON-LD and product pages only.

    Does not fall back to shared homepage/LLM image pools (avoids every product
    getting the same carousel).
    """
    all_slugs = [
        s
        for s in (canonical_product_slug(p.product_url, p.name) for p in products)
        if s
    ]

    reconciled: list[ProductExtract] = []
    for product in products:
        product_slug = canonical_product_slug(product.product_url, product.name)
        other_slugs = [s for s in all_slugs if s != product_slug]

        merged: list[ImageCandidate] = []
        seen_urls: set[str] = set()

        def _add(candidates: list[ImageCandidate]) -> None:
            for img in candidates:
                if img.url in seen_urls:
                    continue
                seen_urls.add(img.url)
                merged.append(img)

        limit = brand_import_max_images_per_product()

        # Priority: JSON-LD (per-product on homepage) -> dedicated product page -> slug URL match
        _add(_structured_images_for_product(pages, product))
        _add(_page_images_for_product(pages, product_slug, other_slugs))
        if len(merged) < limit:
            _add(_slug_matched_pool_images(product, product_slug, other_slugs))
        reconciled.append(
            product.model_copy(update={"image_candidates": merged[:limit]}),
        )

    return reconciled
