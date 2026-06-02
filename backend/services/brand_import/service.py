"""Orchestrate brand URL analyze and apply."""

from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from crud.business_client import get_by_id, merge_brand_profile_traits
from crud.product import create_product, update_product
from schemas.brand_import import (
    BrandImportApplyRequest,
    BrandImportApplyResponse,
    BrandImportPreview,
    ProductImportResult,
)
from schemas.product import ProductCreate, ProductUpdate
from services.brand_import.config import brand_import_enabled, brand_import_max_products
from services.brand_import.config import brand_import_max_images_per_product
from services.brand_import.fetcher import fetch_site_pages
from services.brand_import.image_downloader import download_and_upload_product_image
from services.brand_import.llm_extract import (
    BrandImportExtractionError,
    extract_brand_preview,
    heuristic_preview,
)
from services.brand_import.url_validation import BrandImportUrlError, validate_public_http_url
from services.storage.product_images import (
    MAX_IMAGES_PER_PRODUCT,
    ProductImageError,
    append_images_to_product_lists,
)
from utils.product_image_names import parse_product_image_entries

logger = logging.getLogger(__name__)


def _log_brand_import_analyze_summary(client_id: int, preview: BrandImportPreview) -> None:
    """Log crawl/extraction diagnostics (not shown in the import UI)."""
    logger.info(
        "brand_import analyze summary client_id=%s source_url=%s confidence=%s "
        "products=%s fetched_pages=%s warnings=%s",
        client_id,
        preview.source_url,
        preview.confidence,
        len(preview.products),
        preview.fetched_pages,
        preview.warnings,
    )
    if preview.extraction_meta:
        for page in preview.extraction_meta.pages:
            logger.info(
                "brand_import page meta url=%s page_type=%s text_chars=%s "
                "text_raw_chars=%s extractor=%s had_json_ld=%s json_ld_types=%s "
                "structured_products=%s image_candidates=%s",
                page.url,
                page.page_type,
                page.text_chars,
                page.text_raw_chars,
                page.text_extractor,
                page.had_json_ld,
                page.json_ld_types,
                page.structured_product_count,
                page.image_candidate_count,
            )
        logger.info(
            "brand_import structured_product_seeds=%s",
            preview.extraction_meta.structured_product_seeds,
        )


async def analyze_business_url(client_id: int, raw_url: str) -> BrandImportPreview:
    if not brand_import_enabled():
        raise RuntimeError("Brand import is disabled (BRAND_IMPORT_ENABLED=false).")

    validated = validate_public_http_url(raw_url)
    fetch_result = await fetch_site_pages(validated)
    for page in fetch_result.pages:
        logger.info(
            "brand_import page text url=%s extractor=%s text_chars=%s raw_chars=%s page_type=%s",
            page.url,
            page.text_extractor,
            len(page.text),
            page.text_raw_length,
            page.page_type,
        )

    try:
        preview = await extract_brand_preview(
            fetch_result.site_url,
            fetch_result.pages,
            fetch_result.warnings,
        )
    except BrandImportExtractionError:
        if os.getenv("BRAND_IMPORT_ALLOW_HEURISTIC_FALLBACK", "true").strip().lower() in (
            "1",
            "true",
            "yes",
        ):
            preview = heuristic_preview(
                fetch_result.site_url,
                fetch_result.pages,
                fetch_result.warnings,
            )
        else:
            raise

    if len(preview.products) > brand_import_max_products():
        preview.products = preview.products[: brand_import_max_products()]
        preview.warnings.append(
            f"Product list truncated to {brand_import_max_products()} items."
        )

    _log_brand_import_analyze_summary(client_id, preview)
    return preview


async def apply_brand_import(
    db: Session,
    client_id: int,
    request: BrandImportApplyRequest,
) -> BrandImportApplyResponse:
    if not brand_import_enabled():
        raise RuntimeError("Brand import is disabled.")

    client = get_by_id(db, client_id)
    if client is None:
        raise ValueError("Business client not found")

    preview = request.preview
    max_products = brand_import_max_products()
    if len(preview.products) > max_products:
        raise ValueError(
            f"Preview contains {len(preview.products)} products; maximum is {max_products}."
        )

    brand_profile = {
        **preview.model_dump(),
        "imported_at": datetime.now(timezone.utc).isoformat(),
    }

    traits_updated = merge_brand_profile_traits(
        db,
        client_id,
        brand_profile=brand_profile,
        merge_onboarding=request.merge_onboarding_traits,
    )

    products_created: list[ProductImportResult] = []
    if not request.create_products:
        return BrandImportApplyResponse(
            brand_profile_saved=True,
            products_created=[],
            traits_updated=traits_updated,
        )

    indexes = request.selected_product_indexes
    if not indexes:
        indexes = list(range(len(preview.products)))

    for idx in indexes:
        if idx < 0 or idx >= len(preview.products):
            continue
        product_extract = preview.products[idx]
        metadata = {
            "import_source": "brand_url",
            "source_url": preview.source_url,
            "value_propositions": product_extract.value_propositions,
            "offers": product_extract.offers,
        }
        created = create_product(
            db,
            client_id,
            ProductCreate(
                name=product_extract.name,
                description=product_extract.description,
                product_link=product_extract.product_url,
                product_metadata=json.dumps(metadata),
                is_active=True,
            ),
        )

        image_errors: list[str] = []
        new_urls: list[str] = []
        new_names: list[str] = []
        selected_image_indexes = request.selected_images.get(str(idx), [])
        if not selected_image_indexes and product_extract.image_candidates:
            selected_image_indexes = [0]

        for img_idx in selected_image_indexes:
            if len(new_urls) >= min(MAX_IMAGES_PER_PRODUCT, brand_import_max_images_per_product()):
                break
            if img_idx < 0 or img_idx >= len(product_extract.image_candidates):
                continue
            candidate = product_extract.image_candidates[img_idx]
            try:
                blob_url, blob_name = await download_and_upload_product_image(candidate.url)
                new_urls.append(blob_url)
                new_names.append(blob_name)
            except (ProductImageError, BrandImportUrlError) as exc:
                image_errors.append(f"{candidate.url}: {exc}")
                logger.warning("Brand import image failed: %s", exc)

        if new_urls:
            existing_urls = parse_product_image_entries(created.image_url)
            existing_names = parse_product_image_entries(created.image_name)
            image_url_json, image_name_json = append_images_to_product_lists(
                existing_urls, existing_names, new_urls, new_names
            )
            update_product(
                db,
                created.id,
                ProductUpdate(image_url=image_url_json, image_name=image_name_json),
            )

        products_created.append(
            ProductImportResult(
                product_id=created.id,
                name=created.name,
                image_errors=image_errors,
            )
        )

    return BrandImportApplyResponse(
        brand_profile_saved=True,
        products_created=products_created,
        traits_updated=traits_updated,
    )


def get_limits(_client_id: int) -> dict:
    """Limits endpoint kept for API compatibility; analyze is not rate-limited."""
    return {
        "enabled": brand_import_enabled(),
        "max_analyzes_per_hour": -1,
        "remaining_analyzes_this_hour": -1,
    }
