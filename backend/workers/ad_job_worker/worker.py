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
from crud.persona import get_personas
from schemas.ad_variant import AdVariantCreate, AdVariantUpdate
from schemas.ad_job import AdJobCreate
from schemas.ad_job_batch import AdJobBatchCreate
from workers.script_creation_worker.worker import generate_ad_script
from workers.ad_video_generation_worker.worker import generate_ad_video
from workers.script_moderation_worker.worker import evaluate_script
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
    """Resolve campaign brief for a version. brief_json is a JSON object with keys = version_number, value = brief text."""
    if not brief_json or not brief_json.strip():
        return ""
    try:
        data = json.loads(brief_json)
        if not isinstance(data, dict):
            return ""
        # Keys may be stored as string or int
        val = data.get(str(version_number))
        if val is None:
            val = data.get(version_number)
        return val if val is not None else ""
    except (json.JSONDecodeError, TypeError):
        return ""


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
            raise ValueError(f"Campaign not found: {campaign_id}")
        campaign_brief = _brief_for_version(campaign.brief, version_number)

        consumer = get_consumer(db, consumer_id)
        if consumer is None:
            raise ValueError(f"Consumer not found: {consumer_id}")
        consumer_traits = json.loads(consumer.traits or "{}")
        consumer_traits_string = (
            "\n".join(f"{k}: {v}" for k, v in consumer_traits.items()) if consumer_traits else ""
        )

        product = get_product(db, product_id)
        if product is None:
            raise ValueError(f"Product not found: {product_id}")
        if not product.image_name or not product.image_name.strip():
            raise ValueError(f"Product {product_id} has no image (image_name required for ad generation)")
        product_name = product.name
        product_description = product.description
        product_image_filename = product.image_name

        product_image_blob_client = BlobClient.from_connection_string(
            conn_str=os.getenv("AZURE_STORAGE_CONNECTION_STRING", "").strip(),
            container_name="product-images",
            blob_name=f"{product_image_filename}",
        )
        product_image_download = product_image_blob_client.download_blob()
        product_image_bytes = product_image_download.readall()
        props = product_image_blob_client.get_blob_properties()
        product_image_type = props.content_settings.content_type or "image/png"
        product_image_filename = props.name
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
        update_ad_variant(
            db,
            ad_variant_id,
            AdVariantUpdate(status="failed", meta=json.dumps({"error": traceback.format_exc()})),
        )
        raise
    finally:
        db.close()
    return ad_variant_id


async def generate_campaign_preview(
    campaign_id: int, product_id: int, version_number: int
) -> list:
    """Generate up to 6 preview ad variants (one consumer per selected persona). Returns list of ad_variant IDs."""
    factory = _get_session_factory()
    db: Session = factory()
    try:
        campaign = get_campaign(db, campaign_id)
        if campaign is None:
            raise ValueError(f"Campaign not found: {campaign_id}")

        personas = get_personas(db)
        selected_personas = random.sample(personas, min(6, len(personas)))
        created_ad_variant_ids = []
        for persona in selected_personas:
            consumers = get_consumers_by_persona_id(db, persona.id)
            if not consumers:
                continue
            selected_consumer = random.choice(consumers)
            ad_variant_id = await execute_ad_job(campaign_id, product_id, selected_consumer.id, version_number, is_preview=True)
            created_ad_variant_ids.append(ad_variant_id)
        return created_ad_variant_ids
    finally:
        db.close()


async def generate_campaign_ad_variants(
    campaign_id: int, product_id: int, version_number: int, user_id: Optional[uuid.UUID] = None
):
    """Enqueue ad jobs for all consumers that don't yet have an ad variant for this campaign/version. Returns batch ID."""
    factory = _get_session_factory()
    db: Session = factory()
    try:
        consumers = get_all_consumers(db)
        need_to_generate = []
        for consumer in consumers:
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
