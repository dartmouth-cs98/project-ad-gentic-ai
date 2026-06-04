"""Parse product `image_url` / `image_name` columns (JSON array or legacy plain string)."""

from __future__ import annotations

import json
from typing import Optional


def parse_product_image_entries(raw: str | None) -> list[str]:
    """Return list of blob names or URLs as stored (same rules as product upload routes).

    - None / empty → []
    - JSON array string → each non-empty element as str
    - JSON scalar → single-element list
    - Legacy non-JSON string → [stripped string]
    """
    if raw is None:
        return []
    s = str(raw).strip()
    if not s:
        return []
    try:
        parsed = json.loads(s)
        if isinstance(parsed, list):
            return [str(x) for x in parsed if x]
        return [str(parsed)]
    except (json.JSONDecodeError, ValueError):
        return [s]


def first_product_image_blob_name(raw: str | None) -> Optional[str]:
    """First image entry for ad generation (multi-upload uses first image until a primary flag exists)."""
    names = parse_product_image_entries(raw)
    return names[0] if names else None
