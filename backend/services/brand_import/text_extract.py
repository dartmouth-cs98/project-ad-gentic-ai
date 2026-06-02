"""Main-content text extraction (trafilatura with BeautifulSoup fallback)."""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from typing import Literal

from bs4 import BeautifulSoup

from services.brand_import.config import brand_import_max_text_chars_per_page, brand_import_use_trafilatura

logger = logging.getLogger(__name__)

TextExtractorName = Literal["trafilatura", "beautifulsoup", "beautifulsoup_stripped"]

_BOILERPLATE_HINTS = (
    "cookie",
    "consent",
    "banner",
    "newsletter",
    "popup",
    "modal",
    "sidebar",
    "nav",
    "menu",
    "footer",
    "header",
)


@dataclass(frozen=True)
class TextExtractResult:
    text: str
    extractor: TextExtractorName
    raw_length: int


def _normalize_whitespace(text: str) -> str:
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _cap_text(text: str) -> str:
    limit = brand_import_max_text_chars_per_page()
    if len(text) <= limit:
        return text
    return text[:limit] + "\n…"


def _beautifulsoup_plain_text(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "noscript", "svg"]):
        tag.decompose()
    return _normalize_whitespace(soup.get_text(separator="\n", strip=True))


def _strip_boilerplate_elements(soup: BeautifulSoup) -> None:
    for tag_name in ("nav", "footer", "header", "aside"):
        for tag in soup.find_all(tag_name):
            tag.decompose()

    for tag in soup.find_all(True):
        role = (tag.get("role") or "").lower()
        if role in ("navigation", "banner", "contentinfo"):
            tag.decompose()
            continue

        ident = " ".join(
            filter(
                None,
                [
                    str(tag.get("id") or ""),
                    " ".join(tag.get("class") or []),
                ],
            )
        ).lower()
        if any(hint in ident for hint in _BOILERPLATE_HINTS):
            tag.decompose()


def _beautifulsoup_stripped_text(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "noscript", "svg"]):
        tag.decompose()
    _strip_boilerplate_elements(soup)
    return _normalize_whitespace(soup.get_text(separator="\n", strip=True))


def _trafilatura_text(html: str, url: str) -> str | None:
    try:
        import trafilatura
    except ImportError:
        logger.warning("trafilatura not installed; falling back to BeautifulSoup text extraction")
        return None

    try:
        extracted = trafilatura.extract(
            html,
            url=url,
            include_comments=False,
            include_tables=True,
            favor_precision=True,
        )
    except Exception as exc:
        logger.debug("trafilatura.extract failed for %s: %s", url, exc)
        return None

    if not extracted or not extracted.strip():
        return None
    return _normalize_whitespace(extracted)


def extract_main_text(html: str, url: str) -> TextExtractResult:
    """Extract readable main text; prefer trafilatura when enabled."""
    raw_bs = _beautifulsoup_plain_text(html)
    raw_len = len(raw_bs)

    if brand_import_use_trafilatura():
        tr_text = _trafilatura_text(html, url)
        if tr_text:
            capped = _cap_text(tr_text)
            logger.debug(
                "brand_import text extract url=%s extractor=trafilatura raw_bs=%s out=%s",
                url,
                raw_len,
                len(capped),
            )
            return TextExtractResult(text=capped, extractor="trafilatura", raw_length=raw_len)

    stripped = _beautifulsoup_stripped_text(html)
    if stripped and len(stripped) < len(raw_bs) * 0.85:
        capped = _cap_text(stripped)
        return TextExtractResult(
            text=capped,
            extractor="beautifulsoup_stripped",
            raw_length=raw_len,
        )

    capped = _cap_text(raw_bs)
    return TextExtractResult(text=capped, extractor="beautifulsoup", raw_length=raw_len)
