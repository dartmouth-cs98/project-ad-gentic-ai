"""Product identity matching for brand import deduplication."""

from __future__ import annotations

import re
from urllib.parse import urlparse

_GENERIC_PATH_SEGMENTS = frozenset(
    {
        "products",
        "product",
        "collections",
        "collection",
        "shop",
        "pages",
        "page",
    }
)


def normalize_product_name(name: str) -> str:
    n = re.sub(r"\s+", " ", name.strip().lower())
    if n.startswith("the "):
        n = n[4:]
    return n


def name_as_slug(name: str) -> str:
    n = normalize_product_name(name)
    return re.sub(r"[^a-z0-9]+", "-", n).strip("-")


_VARIANT_SLUG_SUFFIX = re.compile(r"-\d{1,3}$")
_NAME_VARIANT_SUFFIX = re.compile(r"\s+\d{1,3}$", re.IGNORECASE)


def canonical_product_slug(url: str | None = None, name: str | None = None) -> str | None:
    """Shopify handle without variant suffix (e.g. highlight-milk-02 -> highlight-milk)."""
    raw = slug_from_product_url(url) if url else None
    if not raw and name:
        raw = name_as_slug(name)
    if not raw:
        return None
    stripped = _VARIANT_SLUG_SUFFIX.sub("", raw)
    return stripped or raw


def core_product_name(name: str) -> str:
    """Name without trailing variant codes (e.g. 'Highlight Milk 02' -> 'highlight milk')."""
    trimmed = _NAME_VARIANT_SUFFIX.sub("", name.strip())
    return normalize_product_name(trimmed)


def _path_slug(url: str | None) -> str | None:
    if not url:
        return None
    path = urlparse(url).path.strip("/")
    if not path:
        return None
    segment = path.split("/")[-1]
    if segment.lower() in ("", "index.html", "index.htm"):
        return None
    segment = re.sub(r"\.(html?|php|aspx?)$", "", segment, flags=re.I)
    return segment.lower() or None


def slug_from_product_url(url: str | None) -> str | None:
    if not url:
        return None
    parsed = urlparse(url)
    parts = [p for p in parsed.path.strip("/").split("/") if p]
    if not parts:
        return None
    if len(parts) >= 2 and parts[-2].lower() in ("products", "product"):
        return parts[-1].lower()
    slug = _path_slug(url)
    if not slug or slug.lower() in _GENERIC_PATH_SEGMENTS:
        return None
    return slug.lower()


def is_weak_product_url(url: str | None) -> bool:
    if not url or not url.strip():
        return True
    parsed = urlparse(url)
    path = parsed.path.strip("/")
    if not path:
        return True
    parts = path.split("/")
    if len(parts) == 1 and parts[0].lower() in _GENERIC_PATH_SEGMENTS:
        return True
    return False


def product_url_rank(url: str | None) -> int:
    if is_weak_product_url(url):
        return 0
    lower = (url or "").lower()
    score = 1
    if "/products/" in lower or "/product/" in lower:
        score += 10
    score += min(len(urlparse(url or "").path), 50)
    return score


def product_identity_keys(name: str, url: str | None) -> set[str]:
    keys: set[str] = set()
    norm = core_product_name(name)
    if norm:
        keys.add(f"name:{norm}")
    canon = canonical_product_slug(url, name)
    if canon:
        keys.add(f"slug:{canon}")
    url_slug = slug_from_product_url(url)
    if url_slug:
        keys.add(f"slug:{url_slug}")
    name_slug = name_as_slug(name)
    if name_slug:
        keys.add(f"slug:{name_slug}")
    return keys


def products_match(
    name_a: str,
    url_a: str | None,
    name_b: str,
    url_b: str | None,
) -> bool:
    keys_a = product_identity_keys(name_a, url_a)
    keys_b = product_identity_keys(name_b, url_b)
    if keys_a & keys_b:
        return True
    if core_product_name(name_a) == core_product_name(name_b):
        return True
    canon_a = canonical_product_slug(url_a, name_a)
    canon_b = canonical_product_slug(url_b, name_b)
    if canon_a and canon_b and canon_a == canon_b:
        return True
    return False
