"""Tests for brand import image discovery (Phase 3)."""

from __future__ import annotations

from pathlib import Path

from services.brand_import.content_extractor import extract_page_content
from services.brand_import.image_discovery import (
    _best_srcset_url,
    discover_images_from_img_tags,
    infer_linked_product_slug,
    is_likely_junk_image_url,
    merge_discovered_images,
    path_slug,
)
from bs4 import BeautifulSoup

FIXTURES = Path(__file__).resolve().parent / "fixtures" / "brand_import"


def test_path_slug_and_product_link():
    page = "https://shop.example.com/products/widget-pro"
    img = "https://shop.example.com/images/widget-pro-1200w.jpg"
    assert path_slug(page) == "widget-pro"
    assert infer_linked_product_slug(page, img) == "widget-pro"


def test_is_likely_junk_filters_icons_and_tiny():
    assert is_likely_junk_image_url("https://cdn.example.com/favicon.ico")
    assert is_likely_junk_image_url("https://cdn.example.com/sprite.png?v=1")
    assert is_likely_junk_image_url("https://cdn.example.com/photo.jpg?w=16")
    assert not is_likely_junk_image_url("https://cdn.example.com/images/widget-pro-1200w.jpg")


def test_best_srcset_picks_largest_width():
    srcset = (
        "https://cdn.example.com/a-480w.jpg 480w, "
        "https://cdn.example.com/a-1200w.jpg 1200w"
    )
    url, width = _best_srcset_url(srcset, "https://cdn.example.com/")
    assert url == "https://cdn.example.com/a-1200w.jpg"
    assert width == 1200


def test_gallery_fixture_finds_product_images_not_only_logo():
    html = (FIXTURES / "gallery_product.html").read_text(encoding="utf-8")
    page_url = "https://shop.example.com/products/widget-pro"
    content = extract_page_content(page_url, html)

    urls = {img.url for img in content.image_candidates}
    assert "https://shop.example.com/favicon.ico" not in urls
    assert "https://shop.example.com/brand-logo.png" not in urls
    assert "https://shop.example.com/pixel.gif" not in urls
    assert "https://shop.example.com/icons/star.svg" not in urls

    productish = [
        u
        for u in urls
        if "widget-pro" in u and "logo" not in u and "favicon" not in u
    ]
    assert len(productish) >= 2

    linked = [img for img in content.image_candidates if img.linked_product_slug == "widget-pro"]
    assert len(linked) >= 1

    srcset_urls = [img for img in content.image_candidates if img.source in ("srcset", "picture")]
    assert any("1200w" in img.url for img in srcset_urls)


def test_lazy_src_collected():
    html = """
    <html><body>
      <img data-lazy-src="https://example.com/products/sku-a/gallery-1.jpg"
           src="https://example.com/1x1.gif" alt="SKU A" />
    </body></html>
    """
    soup = BeautifulSoup(html, "html.parser")
    found = discover_images_from_img_tags(soup, "https://example.com/products/sku-a")
    urls = [f.url for f in found]
    assert "https://example.com/products/sku-a/gallery-1.jpg" in urls
    assert "https://example.com/1x1.gif" not in urls


def test_merge_discovered_images_keeps_higher_width():
    from services.brand_import.image_discovery import DiscoveredImage

    a = DiscoveredImage(url="https://x.com/a.jpg", width_hint=400, source="img")
    b = DiscoveredImage(url="https://x.com/a.jpg", width_hint=1200, source="srcset")
    merged = merge_discovered_images([a], [b])
    assert len(merged) == 1
    assert merged[0].width_hint == 1200
    assert merged[0].source == "srcset"
