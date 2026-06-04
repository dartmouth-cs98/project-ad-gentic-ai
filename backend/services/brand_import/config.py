"""Environment configuration for brand URL import."""

from __future__ import annotations

import os


def _env_truthy(name: str, default: str = "true") -> bool:
    return os.getenv(name, default).strip().lower() in ("1", "true", "yes", "on")


def brand_import_enabled() -> bool:
    return _env_truthy("BRAND_IMPORT_ENABLED", "true")


def brand_import_max_pages() -> int:
    raw = os.getenv("BRAND_IMPORT_MAX_PAGES", "8").strip()
    try:
        return max(1, min(20, int(raw)))
    except ValueError:
        return 8


def brand_import_max_products() -> int:
    raw = os.getenv("BRAND_IMPORT_MAX_PRODUCTS", "10").strip()
    try:
        return max(1, min(25, int(raw)))
    except ValueError:
        return 10


def brand_import_max_images_per_product() -> int:
    raw = os.getenv("BRAND_IMPORT_MAX_IMAGES_PER_PRODUCT", "3").strip()
    try:
        return max(1, min(10, int(raw)))
    except ValueError:
        return 3


def brand_import_fetch_timeout_seconds() -> float:
    raw = os.getenv("BRAND_IMPORT_FETCH_TIMEOUT_SECONDS", "15").strip()
    try:
        return max(3.0, float(raw))
    except ValueError:
        return 15.0


def brand_import_max_bytes_per_page() -> int:
    raw = os.getenv("BRAND_IMPORT_MAX_BYTES_PER_PAGE", "2097152").strip()
    try:
        return max(50_000, int(raw))
    except ValueError:
        return 2_097_152


def brand_import_max_redirects() -> int:
    raw = os.getenv("BRAND_IMPORT_MAX_REDIRECTS", "3").strip()
    try:
        return max(0, min(10, int(raw)))
    except ValueError:
        return 3


def brand_import_user_agent() -> str:
    return os.getenv(
        "BRAND_IMPORT_USER_AGENT",
        "AdgenticBrandBot/1.0 (+https://adgentic.ai; brand-import)",
    ).strip() or "AdgenticBrandBot/1.0"


def brand_import_use_trafilatura() -> bool:
    return _env_truthy("BRAND_IMPORT_USE_TRAFILATURA", "true")


def brand_import_max_text_chars_per_page() -> int:
    raw = os.getenv("BRAND_IMPORT_MAX_TEXT_CHARS_PER_PAGE", "25000").strip()
    try:
        return max(1000, min(100_000, int(raw)))
    except ValueError:
        return 25_000


def brand_import_image_head_check_enabled() -> bool:
    return _env_truthy("BRAND_IMPORT_IMAGE_HEAD_CHECK", "false")
