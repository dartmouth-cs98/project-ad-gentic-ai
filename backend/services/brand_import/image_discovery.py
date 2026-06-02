"""Discover product and hero image URLs from HTML, meta, and JSON-LD."""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from typing import Literal
from urllib.parse import urlparse

from bs4 import BeautifulSoup, Tag

from services.brand_import.config import brand_import_image_head_check_enabled
from services.brand_import.product_dedupe import canonical_product_slug
from services.brand_import.structured_data import StructuredPageHints
from services.brand_import.url_validation import absolutize

logger = logging.getLogger(__name__)

ImageSource = Literal["og", "json_ld", "srcset", "lazy", "img", "picture"]

_ICON_URL_FRAGMENTS = (
    "pixel",
    "tracking",
    "spacer",
    "1x1",
    "favicon",
    "sprite",
    "icon",
    "emoji",
    "badge",
    "avatar",
    "gravatar",
)

_SIZE_QUERY_HINTS = re.compile(r"(?:[?&](?:w|width|h|height)=)(?:1[0-6]|[1-9])\b", re.I)


@dataclass(frozen=True)
class DiscoveredImage:
    url: str
    alt: str | None = None
    linked_product_slug: str | None = None
    source: ImageSource = "img"
    width_hint: int = 0


def path_slug(url: str | None) -> str | None:
    if not url:
        return None
    path = urlparse(url).path.strip("/")
    if not path:
        return None
    segment = path.split("/")[-1]
    if segment.lower() in ("", "index.html", "index.htm"):
        return None
    # strip common extensions for matching
    segment = re.sub(r"\.(html?|php|aspx?)$", "", segment, flags=re.I)
    return segment.lower() or None


def _slugs_related(page_slug: str | None, image_slug: str | None) -> bool:
    if not page_slug or not image_slug:
        return False
    return page_slug == image_slug


def _image_file_stem(image_url: str) -> str:
    segment = image_url.rstrip("/").split("/")[-1].lower()
    segment = re.sub(r"\.[a-z0-9]{2,5}$", "", segment, flags=re.I)
    return segment


def infer_linked_product_slug(page_url: str, image_url: str) -> str | None:
    page_slug = canonical_product_slug(page_url, None) or path_slug(page_url)
    if not page_slug:
        return None
    stem = _image_file_stem(image_url)
    if stem == page_slug or stem.startswith(f"{page_slug}-"):
        return page_slug
    return None


def is_likely_junk_image_url(url: str, *, alt: str = "") -> bool:
    lower = url.lower()
    if any(fragment in lower for fragment in _ICON_URL_FRAGMENTS):
        return True
    if _SIZE_QUERY_HINTS.search(url):
        return True
    if re.search(r"/(?:icons?|favicons?)/", lower):
        return True
    if "logo" in alt.lower() and any(x in lower for x in ("logo", "brand", "icon")):
        return True
    return False


def _parse_srcset(srcset: str, base_url: str) -> list[tuple[int, str]]:
    """Return (width_hint, absolute_url) pairs from a srcset attribute."""
    entries: list[tuple[int, str]] = []
    for part in srcset.split(","):
        part = part.strip()
        if not part:
            continue
        pieces = part.split()
        if not pieces:
            continue
        raw_url = pieces[0]
        abs_url = absolutize(base_url, raw_url)
        if not abs_url:
            continue
        width = 0
        if len(pieces) >= 2:
            descriptor = pieces[-1].lower()
            if descriptor.endswith("w"):
                try:
                    width = int(descriptor[:-1])
                except ValueError:
                    width = 0
            elif descriptor.endswith("x"):
                try:
                    width = int(float(descriptor[:-1]) * 1000)
                except ValueError:
                    width = 0
        entries.append((width, abs_url))
    return entries


def _best_srcset_url(srcset: str | None, base_url: str) -> tuple[str | None, int]:
    if not srcset or not srcset.strip():
        return None, 0
    parsed = _parse_srcset(srcset, base_url)
    if not parsed:
        return None, 0
    width, url = max(parsed, key=lambda item: item[0])
    return url, width


def _img_lazy_src(img: Tag) -> str | None:
    """Prefer lazy-load attributes over placeholder src."""
    for attr in (
        "data-src",
        "data-lazy-src",
        "data-original",
        "data-lazy",
        "data-url",
        "src",
    ):
        value = img.get(attr)
        if not isinstance(value, str):
            continue
        value = value.strip()
        if not value or value.startswith("data:"):
            continue
        if attr == "src" and is_likely_junk_image_url(value):
            continue
        return value
    return None


def _add_candidate(
    candidates: list[DiscoveredImage],
    seen: set[str],
    *,
    url: str | None,
    page_url: str,
    alt: str | None = None,
    source: ImageSource = "img",
    width_hint: int = 0,
) -> None:
    if not url:
        return
    abs_url = absolutize(page_url, url) if not url.startswith(("http://", "https://")) else url
    if not abs_url or abs_url in seen:
        return
    if is_likely_junk_image_url(abs_url, alt=alt or ""):
        return
    seen.add(abs_url)
    candidates.append(
        DiscoveredImage(
            url=abs_url,
            alt=alt,
            linked_product_slug=infer_linked_product_slug(page_url, abs_url),
            source=source,
            width_hint=width_hint,
        )
    )


def discover_images_from_img_tags(soup: BeautifulSoup, page_url: str) -> list[DiscoveredImage]:
    candidates: list[DiscoveredImage] = []
    seen: set[str] = set()

    for picture in soup.find_all("picture"):
        for source in picture.find_all("source"):
            srcset = source.get("srcset") or source.get("data-srcset")
            best_url, width = _best_srcset_url(srcset, page_url)
            _add_candidate(
                candidates,
                seen,
                url=best_url,
                page_url=page_url,
                source="picture",
                width_hint=width,
            )
        img = picture.find("img")
        if img:
            srcset = img.get("srcset") or img.get("data-srcset")
            best_url, width = _best_srcset_url(srcset, page_url)
            if best_url:
                _add_candidate(
                    candidates,
                    seen,
                    url=best_url,
                    page_url=page_url,
                    alt=img.get("alt"),
                    source="srcset",
                    width_hint=width,
                )
            else:
                _add_candidate(
                    candidates,
                    seen,
                    url=_img_lazy_src(img),
                    page_url=page_url,
                    alt=img.get("alt"),
                    source="lazy" if img.get("data-src") else "img",
                )

    for img in soup.find_all("img"):
        if img.find_parent("picture"):
            continue
        alt = img.get("alt") if isinstance(img.get("alt"), str) else None
        srcset = img.get("srcset") or img.get("data-srcset")
        best_url, width = _best_srcset_url(srcset, page_url)
        if best_url:
            _add_candidate(
                candidates,
                seen,
                url=best_url,
                page_url=page_url,
                alt=alt,
                source="srcset",
                width_hint=width,
            )
            continue
        lazy = _img_lazy_src(img)
        source: ImageSource = "lazy" if img.get("data-src") or img.get("data-lazy-src") else "img"
        _add_candidate(candidates, seen, url=lazy, page_url=page_url, alt=alt, source=source)

    return candidates


def discover_images_from_meta(meta: dict[str, str], page_url: str) -> list[DiscoveredImage]:
    candidates: list[DiscoveredImage] = []
    seen: set[str] = set()
    og = meta.get("og:image:absolute") or meta.get("og:image")
    _add_candidate(candidates, seen, url=og, page_url=page_url, source="og", width_hint=1200)
    twitter = meta.get("twitter:image")
    _add_candidate(candidates, seen, url=twitter, page_url=page_url, source="og", width_hint=800)
    return candidates


def discover_images_from_structured(
    structured: StructuredPageHints,
    page_url: str,
) -> list[DiscoveredImage]:
    candidates: list[DiscoveredImage] = []
    seen: set[str] = set()
    for product in structured.products:
        for u in product.image_urls:
            _add_candidate(
                candidates,
                seen,
                url=u,
                page_url=page_url,
                alt=product.name,
                source="json_ld",
                width_hint=1000,
            )
    return candidates


def merge_discovered_images(*groups: list[DiscoveredImage]) -> list[DiscoveredImage]:
    """Dedupe by URL; keep highest width_hint per URL."""
    by_url: dict[str, DiscoveredImage] = {}
    for group in groups:
        for img in group:
            existing = by_url.get(img.url)
            if existing is None or img.width_hint > existing.width_hint:
                by_url[img.url] = img
    merged = list(by_url.values())
    merged.sort(key=lambda i: i.width_hint, reverse=True)
    return merged


def filter_images_with_head_check(images: list[DiscoveredImage]) -> list[DiscoveredImage]:
    """Optional HEAD validation (sync); drops non-image or tiny responses."""
    if not brand_import_image_head_check_enabled():
        return images

    import httpx

    from services.brand_import.config import brand_import_fetch_timeout_seconds

    timeout = min(5.0, brand_import_fetch_timeout_seconds())
    kept: list[DiscoveredImage] = []
    with httpx.Client(timeout=timeout, follow_redirects=True) as client:
        for img in images:
            try:
                response = client.head(img.url)
                if response.status_code >= 400:
                    continue
                content_type = (response.headers.get("content-type") or "").lower()
                if content_type and "image" not in content_type:
                    continue
                length = response.headers.get("content-length")
                if length is not None:
                    try:
                        if int(length) < 2_000:
                            continue
                    except ValueError:
                        pass
                kept.append(img)
            except httpx.HTTPError as exc:
                logger.debug("HEAD skip %s: %s", img.url, exc)
                kept.append(img)
    return kept


def discover_page_images(
    soup: BeautifulSoup,
    page_url: str,
    meta: dict[str, str],
    structured: StructuredPageHints,
) -> list[DiscoveredImage]:
    groups = [
        discover_images_from_meta(meta, page_url),
        discover_images_from_structured(structured, page_url),
        discover_images_from_img_tags(soup, page_url),
    ]
    merged = merge_discovered_images(*groups)
    return filter_images_with_head_check(merged)[:40]


def enrich_structured_product_images(
    pages: list,
    site_products: list,
) -> None:
    """Attach page-level images to structured product hints when slugs align."""
    for product in site_products:
        canon_product_slug = canonical_product_slug(product.url, product.name) if product.url else None
        for page in pages:
            page_slug = canonical_product_slug(page.url, None) if getattr(page, "url", None) else None
            if canon_product_slug and page_slug and canon_product_slug != page_slug:
                continue
            for img in getattr(page, "image_candidates", []):
                if img.linked_product_slug and canon_product_slug:
                    if img.linked_product_slug == canon_product_slug:
                        if img.url not in product.image_urls:
                            product.image_urls.append(img.url)


def format_images_for_llm(pages: list) -> str:
    lines: list[str] = []
    for page in pages:
        candidates = getattr(page, "image_candidates", None) or []
        if not candidates:
            continue
        lines.append(f"PAGE {page.url} IMAGE CANDIDATES (prefer high width_hint; use linked_product_slug):")
        for img in candidates[:20]:
            parts = [f"url={img.url}", f"source={img.source}", f"width_hint={img.width_hint}"]
            if img.alt:
                parts.append(f"alt={img.alt!r}")
            if img.linked_product_slug:
                parts.append(f"linked_product_slug={img.linked_product_slug!r}")
            lines.append("  - " + ", ".join(parts))
    return "\n".join(lines) if lines else "(no images listed)"
