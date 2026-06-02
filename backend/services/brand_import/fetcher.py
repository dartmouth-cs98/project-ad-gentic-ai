"""Fetch public pages for brand import."""

from __future__ import annotations

import logging
from dataclasses import dataclass

import httpx

from services.brand_import.config import (
    brand_import_fetch_timeout_seconds,
    brand_import_max_bytes_per_page,
    brand_import_max_pages,
    brand_import_max_redirects,
    brand_import_user_agent,
)
from services.brand_import.content_extractor import (
    PageContent,
    discover_same_site_links,
    extract_page_content,
    score_link,
)
from services.brand_import.safe_http import brand_import_http_client
from services.brand_import.url_validation import ValidatedUrl, absolutize, same_registrable_domain

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class FetchResult:
    pages: list[PageContent]
    warnings: list[str]


async def fetch_site_pages(validated: ValidatedUrl) -> FetchResult:
    """Fetch homepage and same-host linked pages up to configured max."""
    max_pages = brand_import_max_pages()
    timeout = brand_import_fetch_timeout_seconds()
    warnings: list[str] = []
    pages: list[PageContent] = []
    queue: list[str] = [validated.normalized]
    seen: set[str] = set()

    headers = {"User-Agent": brand_import_user_agent(), "Accept": "text/html,application/xhtml+xml"}

    async with brand_import_http_client(
        max_redirects=brand_import_max_redirects(),
        timeout=httpx.Timeout(timeout, connect=min(10.0, timeout)),
        headers=headers,
    ) as client:
        while queue and len(pages) < max_pages:
            url = queue.pop(0)
            if url in seen:
                continue
            seen.add(url)
            if not same_registrable_domain(validated.normalized, url):
                continue
            try:
                response = await client.get(url)
                response.raise_for_status()
            except httpx.HTTPError as exc:
                warnings.append(f"Failed to fetch {url}: {exc}")
                continue

            content_type = (response.headers.get("content-type") or "").lower()
            if "html" not in content_type and "text/" not in content_type:
                warnings.append(f"Skipped non-HTML URL {url} ({content_type})")
                continue

            body = response.content
            if len(body) > brand_import_max_bytes_per_page():
                body = body[: brand_import_max_bytes_per_page()]
                warnings.append(f"Truncated large response from {url}")

            try:
                html = body.decode(response.encoding or "utf-8", errors="replace")
            except Exception:
                html = body.decode("utf-8", errors="replace")

            page = extract_page_content(url, html)
            pages.append(page)

            if len(pages) >= max_pages:
                break

            for link in discover_same_site_links(url, html):
                if link not in seen and link not in queue:
                    queue.append(link)
            queue.sort(key=score_link, reverse=True)

    if not pages:
        raise RuntimeError("Could not fetch any HTML pages from the provided URL")

    return FetchResult(pages=pages, warnings=warnings)
