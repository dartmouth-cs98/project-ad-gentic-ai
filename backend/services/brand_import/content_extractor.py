"""HTML → plain text and image candidate discovery."""

from __future__ import annotations

from dataclasses import dataclass, field
from bs4 import BeautifulSoup

from services.brand_import.image_discovery import DiscoveredImage, discover_page_images
from services.brand_import.structured_data import (
    PageType,
    StructuredPageHints,
    extract_meta_tags,
    extract_structured_page_hints,
    infer_page_type,
    structured_page_json_for_prompt,
)
from services.brand_import.text_extract import TextExtractorName, extract_main_text
from services.brand_import.url_validation import absolutize


@dataclass(frozen=True)
class PageContent:
    url: str
    title: str
    text: str
    image_urls: list[str]
    image_candidates: list[DiscoveredImage] = field(default_factory=list)
    page_type: PageType = "other"
    structured: StructuredPageHints = field(default_factory=StructuredPageHints)
    meta: dict[str, str] = field(default_factory=dict)
    text_extractor: TextExtractorName = "beautifulsoup"
    text_raw_length: int = 0


_PATH_PRIORITY = (
    ("product", 10),
    ("pricing", 9),
    ("price", 8),
    ("shop", 7),
    ("faq", 6),
    ("about", 5),
    ("testimonial", 5),
    ("review", 4),
    ("offer", 4),
    ("service", 3),
)


def score_link(url: str) -> int:
    lower = url.lower()
    score = 0
    for token, weight in _PATH_PRIORITY:
        if token in lower:
            score += weight
    if lower.rstrip("/").count("/") <= 3:
        score += 1
    return score


def extract_page_content(page_url: str, html: str) -> PageContent:
    structured = extract_structured_page_hints(html, page_url)
    meta = extract_meta_tags(html, page_url)

    soup = BeautifulSoup(html, "html.parser")
    title = meta.get("title") or ((soup.title.string or "").strip() if soup.title else "")
    if not title and meta.get("og:title"):
        title = meta["og:title"]

    text_result = extract_main_text(html, page_url)
    text = text_result.text

    for tag in soup(["script", "style", "noscript", "svg"]):
        tag.decompose()

    image_candidates = discover_page_images(soup, page_url, meta, structured)
    unique_urls = [img.url for img in image_candidates][:30]

    page_type = infer_page_type(page_url, title, structured)

    return PageContent(
        url=page_url,
        title=title,
        text=text,
        image_urls=unique_urls,
        image_candidates=image_candidates[:30],
        page_type=page_type,
        structured=structured,
        meta=meta,
        text_extractor=text_result.extractor,
        text_raw_length=text_result.raw_length,
    )


def discover_same_site_links(page_url: str, html: str, max_links: int = 40) -> list[str]:
    soup = BeautifulSoup(html, "html.parser")
    found: list[str] = []
    seen: set[str] = {page_url}
    for anchor in soup.find_all("a", href=True):
        href = anchor.get("href") or ""
        abs_url = absolutize(page_url, href)
        if not abs_url or abs_url in seen:
            continue
        if not abs_url.startswith(("http://", "https://")):
            continue
        seen.add(abs_url)
        found.append(abs_url)
    found.sort(key=score_link, reverse=True)
    return found[:max_links]


def build_corpus(pages: list[PageContent]) -> str:
    parts: list[str] = []
    for page in pages:
        header = f"=== PAGE: {page.url} ===\nPAGE_TYPE: {page.page_type}"
        if page.title:
            header += f"\nTitle: {page.title}"
        structured_block = structured_page_json_for_prompt(page.structured, page.meta)
        meta_lines = ""
        if page.meta:
            meta_lines = "META:\n" + "\n".join(f"  {k}: {v}" for k, v in page.meta.items() if k != "title")
        parts.append(
            f"{header}\n\nSTRUCTURED_JSON:\n{structured_block}\n\n{meta_lines}\n\nPAGE TEXT:\n{page.text}"
        )
    return "\n\n".join(parts)


def page_extraction_summaries(pages: list[PageContent]) -> list[dict]:
    return [
        {
            "url": p.url,
            "page_type": p.page_type,
            "text_chars": len(p.text),
            "text_raw_chars": p.text_raw_length,
            "text_extractor": p.text_extractor,
            "had_json_ld": bool(p.structured.json_ld_types),
            "json_ld_types": list(p.structured.json_ld_types),
            "structured_product_count": len(p.structured.products),
            "image_candidate_count": len(p.image_candidates),
        }
        for p in pages
    ]
