import base64
import io
import json
import os
import random
import traceback
import uuid
from typing import Optional
import logging
from dotenv import load_dotenv
from PIL import Image, UnidentifiedImageError
from sqlalchemy.orm import Session

from database import _get_session_factory
from utils.product_image_names import first_product_image_blob_name
from workers.ad_job_worker.errors import AdJobClientError
from crud.ad_variant import (
    create_ad_variant,
    update_ad_variant,
    get_ad_variant_by_campaign_consumer_version,
)
from crud.ad_job import create_ad_job
from crud.ad_job_batch import create_ad_job_batch
from crud.campaign import get_campaign
from crud.consumer import get_consumer, get_all_consumers, get_consumers_by_persona_id
from crud.product import get_product
from schemas.ad_variant import AdVariantCreate, AdVariantUpdate
from schemas.ad_job import AdJobCreate
from schemas.ad_job_batch import AdJobBatchCreate
from services.consumer_traits_description import consumer_profile_text_for_script
from utils.campaign_version_brief import resolve_brief_and_preferences_for_version
from utils.plan_execution import (
    parse_plan_json_from_message,
    find_persona_for_plan_group_name,
    load_all_personas,
    resolve_persona_ids_from_plan,
    variants_per_group_target,
    pick_consumers_for_preview_group,
)
from workers.script_creation_worker.worker import generate_ad_script
from workers.ad_video_generation_worker.worker import generate_ad_video
from workers.script_moderation_worker.worker import evaluate_script
from azure.core.exceptions import ResourceNotFoundError
from azure.storage.blob import BlobClient, ContentSettings

load_dotenv()
logger = logging.getLogger(__name__)

# Target size for product images (portrait, e.g. for short-form video).
PRODUCT_IMAGE_WIDTH = 720
PRODUCT_IMAGE_HEIGHT = 1280


def _resize_product_image(image_bytes: bytes, content_type: str) -> tuple[bytes, str]:
    """Resize product image to 720x1280. Returns (resized_bytes, content_type). On failure, returns original."""
    try:
        img = Image.open(io.BytesIO(image_bytes))
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGBA")
            out_format = "PNG"
            out_content_type = "image/png"
        else:
            img = img.convert("RGB")
            out_format = "JPEG"
            out_content_type = "image/jpeg"
        img = img.resize((PRODUCT_IMAGE_WIDTH, PRODUCT_IMAGE_HEIGHT), Image.Resampling.LANCZOS)
        buf = io.BytesIO()
        if out_format == "JPEG":
            img.save(buf, format=out_format, quality=95)
        else:
            img.save(buf, format=out_format)
        return buf.getvalue(), out_content_type
    except (UnidentifiedImageError, OSError) as e:
        logger.warning("Resize failed, using original image: %s", e)
        return image_bytes, content_type


def _brief_for_version(brief_json: Optional[str], version_number: int) -> str:
    """Resolve plan text for a version (legacy string entries and structured ``plan_message``)."""
    text, _, _ = resolve_brief_and_preferences_for_version(brief_json, version_number)
    return text


async def execute_ad_job(campaign_id: int, product_id: int, consumer_id: int, version_number: int, is_preview: bool = False) -> int:
    logger.info(
        "Executing ad job for campaign %s, product %s, consumer %s, version %s",
        campaign_id, product_id, consumer_id, version_number,
    )
    factory = _get_session_factory()
    db: Session = factory()
    ad_variant = create_ad_variant(
        db,
        AdVariantCreate(campaign_id=campaign_id, consumer_id=consumer_id, status="Generating", version_number=version_number, is_preview=is_preview),
    )
    ad_variant_id = ad_variant.id

    try:
        campaign = get_campaign(db, campaign_id)
        if campaign is None:
            raise AdJobClientError(f"Campaign not found: {campaign_id}")
        campaign_brief, generation_preferences, _ = resolve_brief_and_preferences_for_version(
            campaign.brief, version_number
        )

        consumer = get_consumer(db, consumer_id)
        if consumer is None:
            raise AdJobClientError(f"Consumer not found: {consumer_id}")
        consumer_traits_string = consumer_profile_text_for_script(consumer)

        product = get_product(db, product_id)
        if product is None:
            raise AdJobClientError(f"Product not found: {product_id}")
        product_image_filename = first_product_image_blob_name(product.image_name)
        if not product_image_filename:
            raise AdJobClientError(
                f"Product {product_id} has no image (image_name required for ad generation)"
            )
        product_name = product.name
        product_description = product.description

        product_image_blob_client = BlobClient.from_connection_string(
            conn_str=os.getenv("AZURE_STORAGE_CONNECTION_STRING", "").strip(),
            container_name="product-images",
            blob_name=product_image_filename,
        )
        blob_name_for_error = product_image_filename
        try:
            product_image_download = product_image_blob_client.download_blob()
            product_image_bytes = product_image_download.readall()
            props = product_image_blob_client.get_blob_properties()
            product_image_type = props.content_settings.content_type or "image/png"
            product_image_filename = props.name
        except ResourceNotFoundError as e:
            raise AdJobClientError(
                f"Product image not found in storage (container product-images, blob {blob_name_for_error!r}). "
                "Re-upload the product image or fix image_name in the database."
            ) from e
        product_image_bytes, product_image_type = _resize_product_image(
            product_image_bytes, product_image_type
        )
        base64_product_image = base64.b64encode(product_image_bytes).decode("utf-8")
        product_image_data_url = f"data:{product_image_type};base64,{base64_product_image}"

        logger.info("Generating ad script")
        script = await generate_ad_script(
            product_name,
            product_description,
            product_image_data_url,
            consumer_traits_string,
            campaign_brief,
            campaign_name=campaign.name or "",
            campaign_goal=campaign.goal or "",
            campaign_target_audience=campaign.target_audience or "",
            campaign_product_context=campaign.product_context or "",
            generation_preferences=generation_preferences,
        )
        verdict = await evaluate_script(script)
        if not verdict.passed:
            script = await generate_ad_script(
                product_name,
                product_description,
                product_image_data_url,
                consumer_traits_string,
                campaign_brief,
                campaign_name=campaign.name or "",
                campaign_goal=campaign.goal or "",
                campaign_target_audience=campaign.target_audience or "",
                campaign_product_context=campaign.product_context or "",
                generation_preferences=generation_preferences,
                moderation_feedback=verdict.feedback,
            )
        update_ad_variant(db, ad_variant_id, AdVariantUpdate(meta=json.dumps({"script": script})))
        logger.info("Finished generating ad script")

        logger.info("Generating ad video")
        ad_video_bytes = await generate_ad_video(
            script, product_image_bytes, product_image_type, product_image_filename
        )
        logger.info("Finished generating ad video")
        blob_client = BlobClient.from_connection_string(
            conn_str=os.getenv("AZURE_STORAGE_CONNECTION_STRING", "").strip(),
            container_name="ad-videos",
            blob_name=f"ad-videos/{uuid.uuid4().hex}.mp4",
        )
        blob_client.upload_blob(
            ad_video_bytes,
            overwrite=True,
            content_settings=ContentSettings(content_type="video/mp4"),
            max_concurrency=4,
        )
        media_url = blob_client.url
        update_ad_variant(db, ad_variant_id, AdVariantUpdate(media_url=media_url, status="completed"))
    except Exception:
        # Error replaces meta entirely (script, if any, is not preserved)
        err_meta = json.dumps({"error": traceback.format_exc()})
        try:
            db.rollback()
        except Exception:
            logger.warning("rollback after ad job failure failed", exc_info=True)
        try:
            update_ad_variant(
                db,
                ad_variant_id,
                AdVariantUpdate(status="failed", meta=err_meta),
            )
        except Exception:
            logger.warning(
                "Failed to persist ad_variant failure on primary session; retrying with new session",
                exc_info=True,
            )
            try:
                db.close()
            except Exception:
                pass
            retry_db: Session = factory()
            try:
                update_ad_variant(
                    retry_db,
                    ad_variant_id,
                    AdVariantUpdate(status="failed", meta=err_meta),
                )
            except Exception:
                logger.exception(
                    "Could not persist ad_variant failed status for id=%s",
                    ad_variant_id,
                )
            finally:
                retry_db.close()
        raise
    finally:
        db.close()
    return ad_variant_id


async def generate_campaign_preview(
    campaign_id: int, product_id: int, version_number: int
) -> list:
    """Generate preview ad variants using the approved plan's persona groups when available.

    For each ``persona_groups[]`` entry we resolve the DB persona by name, take up to
    ``variants_per_group`` distinct consumers for this tenant (preference snapshot wins over
    ``variant_count`` in the plan JSON). If the plan lists non-empty ``persona_groups`` but no
    variants can be produced (no DB match, no consumers, etc.), returns an **empty** list — no
    random fallback. Legacy behavior (up to 6 random personas, one consumer each) runs only when
    the brief uses **legacy** string entries or structured entries with **no** usable
    ``persona_groups`` list. For **structured** briefs, if ``plan_message`` is non-empty but the
    fenced plan JSON cannot be parsed, returns **empty** (fail closed — no legacy fallback).
    """
    factory = _get_session_factory()
    db: Session = factory()
    try:
        campaign = get_campaign(db, campaign_id)
        if campaign is None:
            raise AdJobClientError(f"Campaign not found: {campaign_id}")

        plan_message, prefs, structured_brief = resolve_brief_and_preferences_for_version(
            campaign.brief, version_number
        )
        plan = parse_plan_json_from_message(plan_message or "") if plan_message else None
        if structured_brief and (plan_message or "").strip() and plan is None:
            logger.warning(
                "Preview: structured brief has plan_message but plan JSON could not be parsed — "
                "returning empty (no legacy fallback)",
            )
            return []
        groups = plan.get("persona_groups") if plan else None

        if isinstance(groups, list) and groups:
            personas = load_all_personas(db)
            created_ad_variant_ids: list[int] = []
            client_id = campaign.business_client_id
            for g in groups:
                if not isinstance(g, dict):
                    continue
                raw_name = g.get("name")
                persona = find_persona_for_plan_group_name(str(raw_name or ""), personas)
                if persona is None:
                    logger.warning(
                        "Preview: skipping plan persona group %r — no matching Persona in DB",
                        raw_name,
                    )
                    continue
                consumers = get_consumers_by_persona_id(db, persona.id)
                consumers = [c for c in consumers if c.business_client_id == client_id]
                if not consumers:
                    logger.warning(
                        "Preview: no consumers for persona %s (client %s)",
                        persona.name,
                        client_id,
                    )
                    continue
                n = variants_per_group_target(g, prefs)
                picked = pick_consumers_for_preview_group(consumers, n)
                for consumer in picked:
                    ad_variant_id = await execute_ad_job(
                        campaign_id, product_id, consumer.id, version_number, is_preview=True
                    )
                    created_ad_variant_ids.append(ad_variant_id)
            if created_ad_variant_ids:
                return created_ad_variant_ids
            logger.warning(
                "Preview: plan had persona_groups but produced no variants — returning empty (no random fallback)",
            )
            return []

        # Legacy: no persona_groups in plan — random personas (global library), one consumer each
        personas = load_all_personas(db)
        if not personas:
            return []
        selected_personas = random.sample(personas, min(6, len(personas)))
        created_ad_variant_ids = []
        for persona in selected_personas:
            consumers = get_consumers_by_persona_id(db, persona.id)
            consumers = [c for c in consumers if c.business_client_id == campaign.business_client_id]
            if not consumers:
                continue
            selected_consumer = random.choice(consumers)
            ad_variant_id = await execute_ad_job(
                campaign_id, product_id, selected_consumer.id, version_number, is_preview=True
            )
            created_ad_variant_ids.append(ad_variant_id)
        return created_ad_variant_ids
    finally:
        db.close()


async def generate_campaign_ad_variants(
    campaign_id: int, product_id: int, version_number: int, user_id: Optional[uuid.UUID] = None
):
    """Enqueue ad jobs for consumers missing variants for this campaign/version.

    When the approved plan JSON lists ``persona_groups``, only consumers whose **primary**
    persona matches one of those groups (by name → Persona row) are included. If the plan lists
    groups but **no** names resolve to DB personas, returns ``None`` (no batch — avoids silently
    enqueueing the entire tenant). When the plan has no usable ``persona_groups``, all tenant
    consumers remain eligible (**legacy string briefs only**). For **structured** briefs, if
    ``plan_message`` is non-empty but the fenced plan JSON cannot be parsed, returns ``None``
    (fail closed — no full-tenant enqueue).
    """
    factory = _get_session_factory()
    db: Session = factory()
    try:
        campaign = get_campaign(db, campaign_id)
        if campaign is None:
            raise AdJobClientError(f"Campaign not found: {campaign_id}")

        plan_message, _prefs, structured_brief = resolve_brief_and_preferences_for_version(
            campaign.brief, version_number
        )
        plan = parse_plan_json_from_message(plan_message or "") if plan_message else None
        if structured_brief and (plan_message or "").strip() and plan is None:
            logger.warning(
                "Batch: structured brief has plan_message but plan JSON could not be parsed — "
                "skipping enqueue (fix fenced ```json block in approved plan)",
            )
            return None
        raw_groups = plan.get("persona_groups") if plan else None
        has_groups = isinstance(raw_groups, list) and len(raw_groups) > 0
        matched_persona_ids = resolve_persona_ids_from_plan(db, plan) if plan else set()
        if has_groups and not matched_persona_ids:
            logger.warning(
                "Batch: plan lists persona_groups but none matched dbo.personas — "
                "skipping enqueue (fix plan JSON names to match the persona catalog)",
            )
            return None

        filter_by_persona = bool(has_groups and matched_persona_ids)

        consumers = get_all_consumers(db)
        consumers = [c for c in consumers if c.business_client_id == campaign.business_client_id]

        need_to_generate = []
        for consumer in consumers:
            if filter_by_persona and consumer.primary_persona_id not in matched_persona_ids:
                continue
            existing = get_ad_variant_by_campaign_consumer_version(
                db, campaign_id=campaign_id, consumer_id=consumer.id, version_number=version_number
            )
            if existing is None:
                need_to_generate.append(consumer)

        if not need_to_generate:
            return None  # "No ad variants to generate"

        batch_user_id = user_id if user_id is not None else uuid.uuid4()
        ad_job_batch = create_ad_job_batch(
            db,
            AdJobBatchCreate(
                user_id=batch_user_id,
                status="pending",
                total_jobs=len(need_to_generate),
                idempotency_key=None,
            ),
        )
        ad_job_batch_id = ad_job_batch.id
        for consumer in need_to_generate:
            input_json = json.dumps({
                "campaign_id": campaign_id,
                "product_id": product_id,
                "consumer_id": consumer.id,
                "version_number": version_number,
            })
            create_ad_job(
                db,
                AdJobCreate(
                    batch_id=ad_job_batch_id,
                    status="pending",
                    input_json=input_json,
                    attempt_count=0,
                ),
            )
        return ad_job_batch_id
    finally:
        db.close()
