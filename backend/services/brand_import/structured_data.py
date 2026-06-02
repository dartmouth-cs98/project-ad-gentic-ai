"""Parse JSON-LD, meta tags, and page-type hints from HTML."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any, Literal
from urllib.parse import urljoin

from bs4 import BeautifulSoup

from services.brand_import.config import brand_import_max_images_per_product
from services.brand_import.product_dedupe import product_url_rank, products_match
from services.brand_import.product_name import clean_product_display_name, product_base_name_from_json_ld
from services.brand_import.url_validation import absolutize

PageType = Literal["home", "product", "pricing", "faq", "about", "blog", "other"]

_MAX_JSON_LD_BYTES = 100_000
_MAX_STRUCTURED_JSON_CHARS = 8_000


@dataclass
class StructuredProductHint:
    name: str
    description: str | None = None
    url: str | None = None
    image_urls: list[str] = field(default_factory=list)
    price_display: str | None = None
    price_amount: float | None = None
    price_currency: str | None = None
    source_url: str | None = None


@dataclass
class StructuredFaqHint:
    question: str
    answer: str
    source_url: str | None = None


@dataclass
class StructuredReviewHint:
    quote: str
    attribution: str | None = None
    source_url: str | None = None


@dataclass
class StructuredPageHints:
    products: list[StructuredProductHint] = field(default_factory=list)
    faqs: list[StructuredFaqHint] = field(default_factory=list)
    reviews: list[StructuredReviewHint] = field(default_factory=list)
    organization_name: str | None = None
    json_ld_types: list[str] = field(default_factory=list)


@dataclass
class StructuredSiteHints:
    """Aggregated structured signals across all fetched pages."""

    products: list[StructuredProductHint] = field(default_factory=list)
    faqs: list[StructuredFaqHint] = field(default_factory=list)
    reviews: list[StructuredReviewHint] = field(default_factory=list)
    organization_name: str | None = None


def _type_names(node: dict[str, Any]) -> list[str]:
    raw = node.get("@type")
    if raw is None:
        return []
    if isinstance(raw, str):
        return [raw.split("/")[-1]]
    if isinstance(raw, list):
        return [str(t).split("/")[-1] for t in raw if t]
    return []


def _iter_json_ld_nodes(data: Any) -> list[dict[str, Any]]:
    if isinstance(data, dict):
        if "@graph" in data and isinstance(data["@graph"], list):
            nodes: list[dict[str, Any]] = []
            for item in data["@graph"]:
                nodes.extend(_iter_json_ld_nodes(item))
            return nodes
        return [data]
    if isinstance(data, list):
        nodes = []
        for item in data:
            nodes.extend(_iter_json_ld_nodes(item))
        return nodes
    return []


def parse_json_ld_blocks(html: str) -> list[dict[str, Any]]:
    soup = BeautifulSoup(html, "html.parser")
    nodes: list[dict[str, Any]] = []
    for script in soup.find_all("script", type="application/ld+json"):
        raw = (script.string or script.get_text() or "").strip()
        if not raw or len(raw) > _MAX_JSON_LD_BYTES:
            continue
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            continue
        nodes.extend(_iter_json_ld_nodes(data))
    return nodes


def _image_urls_from_value(value: Any, base_url: str) -> list[str]:
    urls: list[str] = []
    if isinstance(value, str):
        abs_u = absolutize(base_url, value)
        if abs_u:
            urls.append(abs_u)
    elif isinstance(value, list):
        for item in value:
            urls.extend(_image_urls_from_value(item, base_url))
    elif isinstance(value, dict):
        for key in ("url", "contentUrl", "@id"):
            if key in value:
                urls.extend(_image_urls_from_value(value[key], base_url))
    return urls


def _product_from_node(node: dict[str, Any], page_url: str) -> StructuredProductHint | None:
    types = {t.lower() for t in _type_names(node)}
    if not types.intersection({"product", "individualproduct", "someproducts"}):
        return None
    raw_name = node.get("name")
    if not isinstance(raw_name, str) or not raw_name.strip():
        return None
    description = node.get("description")
    desc_str = description.strip() if isinstance(description, str) else None
    product_url = node.get("url")
    url_str = product_url if isinstance(product_url, str) else page_url
    resolved_url = absolutize(page_url, url_str) if url_str else page_url
    display_name = product_base_name_from_json_ld(node, resolved_url)
    if not display_name:
        display_name = clean_product_display_name(raw_name.strip(), resolved_url)
    images = _image_urls_from_value(node.get("image"), page_url)
    return StructuredProductHint(
        name=display_name,
        description=desc_str,
        url=resolved_url,
        image_urls=images,
        source_url=page_url,
    )


def _faq_from_node(node: dict[str, Any], page_url: str) -> list[StructuredFaqHint]:
    types = {t.lower() for t in _type_names(node)}
    if "faqpage" not in types:
        return []
    out: list[StructuredFaqHint] = []
    entities = node.get("mainEntity")
    if not isinstance(entities, list):
        return out
    for item in entities:
        if not isinstance(item, dict):
            continue
        q = item.get("name")
        accepted = item.get("acceptedAnswer")
        if not isinstance(q, str) or not isinstance(accepted, dict):
            continue
        ans = accepted.get("text")
        if isinstance(ans, str) and q.strip() and ans.strip():
            out.append(
                StructuredFaqHint(
                    question=q.strip(),
                    answer=ans.strip(),
                    source_url=page_url,
                )
            )
    return out


def _review_from_node(node: dict[str, Any], page_url: str) -> StructuredReviewHint | None:
    types = {t.lower() for t in _type_names(node)}
    if not types.intersection({"review", "aggregaterating"}):
        return None
    body = node.get("reviewBody") or node.get("description")
    if not isinstance(body, str) or not body.strip():
        return None
    author = node.get("author")
    attribution = None
    if isinstance(author, dict):
        attribution = author.get("name") if isinstance(author.get("name"), str) else None
    elif isinstance(author, str):
        attribution = author
    return StructuredReviewHint(quote=body.strip(), attribution=attribution, source_url=page_url)


def _org_name_from_node(node: dict[str, Any]) -> str | None:
    types = {t.lower() for t in _type_names(node)}
    if not types.intersection({"organization", "localbusiness", "corporation", "website", "store"}):
        return None
    name = node.get("name")
    if isinstance(name, str) and name.strip():
        return name.strip()
    return None


def extract_structured_page_hints(html: str, page_url: str) -> StructuredPageHints:
    hints = StructuredPageHints()
    for node in parse_json_ld_blocks(html):
        hints.json_ld_types.extend(_type_names(node))
        product = _product_from_node(node, page_url)
        if product:
            hints.products.append(product)
        hints.faqs.extend(_faq_from_node(node, page_url))
        review = _review_from_node(node, page_url)
        if review:
            hints.reviews.append(review)
        org = _org_name_from_node(node)
        if org and not hints.organization_name:
            hints.organization_name = org
    # dedupe types
    hints.json_ld_types = list(dict.fromkeys(hints.json_ld_types))
    return hints


def extract_meta_tags(html: str, page_url: str) -> dict[str, str]:
    soup = BeautifulSoup(html, "html.parser")
    meta: dict[str, str] = {}

    def _set(key: str, value: str | None) -> None:
        if value and value.strip():
            meta[key] = value.strip()

    if soup.title and soup.title.string:
        _set("title", soup.title.string)

    for tag in soup.find_all("meta"):
        name = (tag.get("name") or tag.get("property") or "").lower()
        content = tag.get("content")
        if not name or not content:
            continue
        if name in (
            "description",
            "og:title",
            "og:description",
            "og:image",
            "og:site_name",
            "twitter:title",
            "twitter:description",
            "twitter:image",
        ):
            _set(name, content)
            if name == "og:image":
                abs_img = absolutize(page_url, content)
                if abs_img:
                    _set("og:image:absolute", abs_img)

    return meta


def infer_page_type(
    page_url: str,
    title: str,
    structured: StructuredPageHints,
) -> PageType:
    path = page_url.lower()
    title_l = title.lower()
    if structured.products:
        return "product"
    if any(t.lower() == "faqpage" for t in structured.json_ld_types) or structured.faqs:
        return "faq"
    if any(x in path for x in ("/pricing", "/plans", "/price")) or "pricing" in title_l:
        return "pricing"
    if any(x in path for x in ("/about", "/company", "/team")) or "about" in title_l:
        return "about"
    if any(x in path for x in ("/blog", "/news", "/article", "/posts/")):
        return "blog"
    if path.rstrip("/").count("/") <= 2 or path.endswith("/"):
        return "home"
    return "other"


def aggregate_site_hints(pages: list) -> StructuredSiteHints:
    """Aggregate from PageContent-like objects with .structured and .url."""
    site = StructuredSiteHints()
    seen_faqs: set[str] = set()

    for page in pages:
        structured: StructuredPageHints = page.structured
        for product in structured.products:
            duplicate_index: int | None = None
            for i, existing in enumerate(site.products):
                if products_match(
                    existing.name,
                    existing.url,
                    product.name,
                    product.url,
                ):
                    duplicate_index = i
                    break
            if duplicate_index is not None:
                existing = site.products[duplicate_index]
                if product_url_rank(product.url) > product_url_rank(existing.url):
                    site.products[duplicate_index] = product
                continue
            site.products.append(product)
        for faq in structured.faqs:
            key = faq.question.lower()
            if key in seen_faqs:
                continue
            seen_faqs.add(key)
            site.faqs.append(faq)
        for review in structured.reviews:
            site.reviews.append(review)
        if structured.organization_name and not site.organization_name:
            site.organization_name = structured.organization_name

    return site


def structured_page_json_for_prompt(structured: StructuredPageHints, meta: dict[str, str]) -> str:
    payload = {
        "meta": meta,
        "json_ld_types": structured.json_ld_types,
        "organization_name": structured.organization_name,
        "products": [
            {
                "name": p.name,
                "description": p.description,
                "url": p.url,
                "image_urls": p.image_urls[: brand_import_max_images_per_product()],
            }
            for p in structured.products[:10]
        ],
        "faqs": [{"question": f.question, "answer": f.answer} for f in structured.faqs[:15]],
        "reviews": [
            {"quote": r.quote, "attribution": r.attribution} for r in structured.reviews[:10]
        ],
    }
    text = json.dumps(payload, ensure_ascii=False)
    if len(text) > _MAX_STRUCTURED_JSON_CHARS:
        return text[:_MAX_STRUCTURED_JSON_CHARS] + "…"
    return text
