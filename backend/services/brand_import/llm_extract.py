"""LLM structured extraction from page corpus."""

from __future__ import annotations

import json
import logging
import os
import re

from openai import AsyncOpenAI

from schemas.brand_import import (
    BrandImportPreview,
    BrandExtract,
    ExtractionMeta,
    FaqExtract,
    ImageCandidate,
    PageExtractionMeta,
    ProductExtract,
)
from services.brand_import.config import (
    brand_import_max_images_per_product,
    brand_import_max_products,
)
from services.brand_import.content_extractor import PageContent, build_corpus, page_extraction_summaries
from services.brand_import.image_discovery import enrich_structured_product_images, format_images_for_llm
from services.brand_import.merge import merge_preview_with_structured
from services.brand_import.product_name import clean_product_display_name
from services.brand_import.structured_data import aggregate_site_hints
from utils.responses_api_text import extract_responses_api_text
from workers.ad_video_generation_worker.provider_selection import _extract_json_object

logger = logging.getLogger(__name__)

_EXTRACTION_INSTRUCTIONS = """You extract structured marketing data from website page text for an ad-generation platform.

Rules:
- Use ONLY facts explicitly supported by the provided page text. Do not invent testimonials or product names.
- Do not extract product prices.
- If a field is unknown, use null or an empty array.
- tone must be one of: formal, playful, bold, minimal — or null if unclear.
- confidence: low if little text; medium if partial; high if rich product/FAQ content.
- Limit products to what is clearly offered on the site (max {max_products}).
- Product names: use the base product name only (e.g. "Highlight Milk"), not variant shades (e.g. "03", "sunbed") or Shopify labels like "Default Title".
- image_candidates: leave empty unless you have URLs from that product's own PAGE IMAGE CANDIDATES with matching linked_product_slug. Do NOT reuse homepage carousel images for every product.
- Do not use favicon, logo, icon, or tiny tracking pixels as product images.
- When STRUCTURED_JSON lists products, prefer those names and URLs; use PAGE TEXT only to enrich descriptions.

Respond with ONLY a single JSON object (no markdown fences) matching this shape:
{{
  "brand": {{
    "name": string | null,
    "tone": "formal" | "playful" | "bold" | "minimal" | null,
    "tone_notes": string | null,
    "value_propositions": [string],
    "target_customer_assumptions": string | null,
    "testimonials": [{{ "quote": string, "attribution": string | null }}],
    "faqs": [{{ "question": string, "answer": string }}],
    "offers": [string],
    "hero_image_url": string | null
  }},
  "products": [{{
    "name": string,
    "description": string | null,
    "product_url": string | null,
    "value_propositions": [string],
    "offers": [string],
    "image_candidates": [{{ "url": string, "alt": string | null, "linked_product_slug": string | null }}]
  }}],
  "warnings": [string],
  "confidence": "low" | "medium" | "high"
}}"""


class BrandImportExtractionError(RuntimeError):
    """LLM returned unusable output."""


def _script_client_and_model() -> tuple[AsyncOpenAI, str]:
    api_key = os.getenv("SCRIPT_API_KEY", "").strip()
    model = os.getenv("SCRIPT_MODEL", "").strip()
    base_url = os.getenv("SCRIPT_BASE_URL", "").strip()
    if not api_key or not base_url or not model:
        raise BrandImportExtractionError(
            "Brand import LLM not configured (SCRIPT_API_KEY, SCRIPT_BASE_URL, SCRIPT_MODEL)."
        )
    return AsyncOpenAI(api_key=api_key, base_url=base_url), model


async def extract_brand_preview(
    source_url: str,
    pages: list[PageContent],
    fetch_warnings: list[str],
) -> BrandImportPreview:
    corpus = build_corpus(pages)
    if len(corpus.strip()) < 80:
        raise BrandImportExtractionError("Not enough text content extracted from the website.")

    client, model = _script_client_and_model()
    max_products = brand_import_max_products()
    user_content = (
        f"Source URL: {source_url}\n\n"
        f"{format_images_for_llm(pages)}\n\n"
        f"PAGE TEXT:\n{corpus}"
    )

    response = await client.responses.create(
        model=model,
        instructions=_EXTRACTION_INSTRUCTIONS.format(max_products=max_products),
        input=[{"role": "user", "content": [{"type": "input_text", "text": user_content}]}],
        max_output_tokens=4000,
    )
    text = extract_responses_api_text(response)
    if not text:
        raise BrandImportExtractionError("LLM returned no extractable text.")

    raw_json = _extract_json_object(text)
    try:
        data = json.loads(raw_json)
    except json.JSONDecodeError as exc:
        raise BrandImportExtractionError(f"LLM response is not valid JSON: {exc}") from exc

    if not isinstance(data, dict):
        raise BrandImportExtractionError("LLM response must be a JSON object.")

    brand_raw = data.get("brand") if isinstance(data.get("brand"), dict) else {}
    products_raw = data.get("products") if isinstance(data.get("products"), list) else []
    warnings = list(fetch_warnings)
    for w in data.get("warnings") or []:
        if isinstance(w, str) and w.strip():
            warnings.append(w.strip())

    products: list[ProductExtract] = []
    for item in products_raw[:max_products]:
        if isinstance(item, dict) and item.get("name"):
            try:
                product = ProductExtract.model_validate(item)
                products.append(
                    product.model_copy(
                        update={
                            "name": clean_product_display_name(
                                product.name,
                                product.product_url,
                            ),
                            "pricing": None,
                        }
                    )
                )
            except Exception as exc:
                warnings.append(f"Skipped invalid product entry: {exc}")

    confidence = data.get("confidence")
    if confidence not in ("low", "medium", "high"):
        confidence = "medium"

    try:
        brand = BrandExtract.model_validate(brand_raw)
    except Exception as exc:
        raise BrandImportExtractionError(f"Invalid brand object in LLM response: {exc}") from exc

    site = aggregate_site_hints(pages)
    enrich_structured_product_images(pages, site.products)
    structured_count = len(site.products)
    preview = BrandImportPreview(
        source_url=source_url,
        fetched_pages=[p.url for p in pages],
        brand=brand,
        products=products,
        warnings=warnings,
        confidence=confidence,
        extraction_meta=ExtractionMeta(
            pages=[PageExtractionMeta(**row) for row in page_extraction_summaries(pages)],
            structured_product_seeds=structured_count,
        ),
    )
    return merge_preview_with_structured(
        preview,
        site,
        structured_product_count=structured_count,
        pages=pages,
    )


def heuristic_preview(
    source_url: str,
    pages: list[PageContent],
    fetch_warnings: list[str],
) -> BrandImportPreview:
    """Fallback when LLM is unavailable (tests / degraded mode)."""
    title = pages[0].title if pages else ""
    snippet = pages[0].text[:500] if pages else ""
    hero = pages[0].image_urls[0] if pages and pages[0].image_urls else None
    site = aggregate_site_hints(pages)
    enrich_structured_product_images(pages, site.products)
    org = site.organization_name
    name = org or title or re.sub(r"^www\.", "", source_url.split("//")[-1].split("/")[0])
    structured_count = len(site.products)

    fallback_products: list[ProductExtract] = []
    if not site.products and name:
        fallback_products = [
            ProductExtract(
                name=clean_product_display_name(name, source_url),
                description=snippet[:400] or None,
                product_url=source_url,
                image_candidates=[
                    ImageCandidate(
                        url=img.url,
                        alt=img.alt,
                        linked_product_slug=img.linked_product_slug,
                    )
                    for img in (
                        pages[0].image_candidates[: brand_import_max_images_per_product()]
                        if pages
                        else []
                    )
                ],
            )
        ]

    base = BrandImportPreview(
        source_url=source_url,
        fetched_pages=[p.url for p in pages],
        brand=BrandExtract(
            name=name,
            value_propositions=[snippet[:200]] if snippet else [],
            target_customer_assumptions=None,
            hero_image_url=hero,
            faqs=[FaqExtract(question=f.question, answer=f.answer) for f in site.faqs[:20]],
        ),
        products=fallback_products,
        warnings=fetch_warnings + ["Used heuristic extraction (LLM not configured)."],
        confidence="low",
        extraction_meta=ExtractionMeta(
            pages=[PageExtractionMeta(**row) for row in page_extraction_summaries(pages)],
            structured_product_seeds=structured_count,
        ),
    )

    return merge_preview_with_structured(
        base,
        site,
        structured_product_count=structured_count,
        pages=pages,
    )
