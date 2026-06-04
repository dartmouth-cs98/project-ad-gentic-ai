"""Tests for product image assignment."""

from __future__ import annotations

from dataclasses import dataclass, field

from schemas.brand_import import ImageCandidate, ProductExtract
from services.brand_import.image_discovery import DiscoveredImage
from services.brand_import.product_images import (
    is_valid_product_image_url,
    reconcile_product_image_candidates,
)
from services.brand_import.structured_data import StructuredPageHints, StructuredProductHint


def test_is_valid_product_image_url_rejects_junk():
    assert not is_valid_product_image_url("")
    assert not is_valid_product_image_url("data:image/png;base64,abc")
    assert not is_valid_product_image_url("https://cdn.example.com/pixel.gif")
    assert is_valid_product_image_url("https://cdn.shopify.com/s/files/1/a/files/product.jpg?v=1")


@dataclass
class FakePage:
    url: str
    image_candidates: list[DiscoveredImage] = field(default_factory=list)
    structured: StructuredPageHints = field(default_factory=StructuredPageHints)


def test_reconcile_uses_json_ld_per_product_not_shared_homepage():
    homepage = FakePage(
        url="https://shop.example.com/",
        image_candidates=[
            DiscoveredImage(url="https://cdn.example.com/highlight.jpg", source="img"),
            DiscoveredImage(url="https://cdn.example.com/bronze.jpg", source="img"),
            DiscoveredImage(url="https://cdn.example.com/tint.jpg", source="img"),
        ],
        structured=StructuredPageHints(
            products=[
                StructuredProductHint(
                    name="Highlight Milk",
                    url="https://shop.example.com/products/highlight-milk",
                    image_urls=["https://cdn.example.com/highlight-only.jpg"],
                ),
                StructuredProductHint(
                    name="Pocket Bronze",
                    url="https://shop.example.com/products/pocket-bronze",
                    image_urls=["https://cdn.example.com/bronze-only.jpg"],
                ),
            ],
        ),
    )
    shared_llm_images = [
        ImageCandidate(url="https://cdn.example.com/highlight.jpg"),
        ImageCandidate(url="https://cdn.example.com/bronze.jpg"),
        ImageCandidate(url="https://cdn.example.com/tint.jpg"),
    ]
    products = [
        ProductExtract(
            name="Highlight Milk",
            product_url="https://shop.example.com/products/highlight-milk",
            image_candidates=shared_llm_images,
        ),
        ProductExtract(
            name="Pocket Bronze",
            product_url="https://shop.example.com/products/pocket-bronze",
            image_candidates=shared_llm_images,
        ),
    ]
    reconciled = reconcile_product_image_candidates([homepage], products)
    assert reconciled[0].image_candidates[0].url == "https://cdn.example.com/highlight-only.jpg"
    assert reconciled[1].image_candidates[0].url == "https://cdn.example.com/bronze-only.jpg"
    assert reconciled[0].image_candidates != reconciled[1].image_candidates


def test_reconcile_product_page_images_not_mixed():
    lip_case_page = FakePage(
        url="https://www.rhodeskin.com/products/lip-case",
        image_candidates=[
            DiscoveredImage(
                url="https://cdn.example.com/files/lip-case-front.jpg",
                source="json_ld",
            ),
        ],
    )
    snap_page = FakePage(
        url="https://www.rhodeskin.com/products/snap-on-lip-case",
        image_candidates=[
            DiscoveredImage(
                url="https://cdn.example.com/files/snap-on-lip-case-hero.jpg",
                source="json_ld",
            ),
        ],
    )
    products = [
        ProductExtract(
            name="Lip Case",
            product_url="https://www.rhodeskin.com/products/lip-case",
            image_candidates=[
                ImageCandidate(url="https://cdn.example.com/files/snap-on-lip-case-hero.jpg"),
            ],
        ),
        ProductExtract(
            name="Snap-On Lip Case",
            product_url="https://www.rhodeskin.com/products/snap-on-lip-case",
            image_candidates=[],
        ),
    ]
    reconciled = reconcile_product_image_candidates([lip_case_page, snap_page], products)
    lip_urls = {img.url for img in reconciled[0].image_candidates}
    snap_urls = {img.url for img in reconciled[1].image_candidates}
    assert "https://cdn.example.com/files/lip-case-front.jpg" in lip_urls
    assert "https://cdn.example.com/files/snap-on-lip-case-hero.jpg" not in lip_urls
    assert "https://cdn.example.com/files/snap-on-lip-case-hero.jpg" in snap_urls


def test_reconcile_drops_invalid_llm_urls():
    page = FakePage(
        url="https://shop.example.com/products/widget",
        structured=StructuredPageHints(
            products=[
                StructuredProductHint(
                    name="Widget",
                    url="https://shop.example.com/products/widget",
                    image_urls=["https://cdn.example.com/widget-real.jpg"],
                ),
            ],
        ),
    )
    products = [
        ProductExtract(
            name="Widget",
            product_url="https://shop.example.com/products/widget",
            image_candidates=[
                ImageCandidate(url="https://shop.example.com/hallucinated.png"),
                ImageCandidate(url="https://cdn.example.com/pixel.gif"),
            ],
        ),
    ]
    reconciled = reconcile_product_image_candidates([page], products)
    urls = [img.url for img in reconciled[0].image_candidates]
    assert urls == ["https://cdn.example.com/widget-real.jpg"]
