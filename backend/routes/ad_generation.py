"""Authenticated ad generation with daily credit enforcement."""

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from crud.business_client import get_by_id
from crud.campaign import get_campaign
from crud.product import get_product
from database import get_db
from dependencies import get_current_client_id
from services.credits import (
    credit_fields_for_client,
    refund_credits,
    reserve_credits,
)
from services.credits_estimation import (
    estimate_batch_variant_count,
    estimate_preview_variant_count,
)
from workers.ad_job_worker.errors import AdJobClientError
from workers.ad_job_worker.worker import (
    generate_campaign_ad_variants as run_generate_campaign_ad_variants,
    generate_campaign_preview as run_generate_campaign_preview,
)

router = APIRouter()
logger = logging.getLogger(__name__)


def _require_campaign_for_client(db: Session, campaign_id: int, client_id: int):
    campaign = get_campaign(db, campaign_id)
    if campaign is None:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if campaign.business_client_id != client_id:
        raise HTTPException(status_code=403, detail="Not authorized for this campaign")
    return campaign


def _require_product_for_client(db: Session, product_id: int, client_id: int):
    product = get_product(db, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.business_client_id != client_id:
        raise HTTPException(status_code=403, detail="Not authorized for this product")
    return product


def _credits_response(db: Session, client_id: int, **extra) -> dict:
    client = get_by_id(db, client_id)
    if client is None:
        raise HTTPException(status_code=404, detail="Business client not found.")
    fields = credit_fields_for_client(db, client)
    payload = {**extra, **fields}
    payload.setdefault("credits_remaining", fields["credits_balance"])
    return payload


@router.post("/generate-campaign-preview")
async def generate_campaign_preview(
    campaign_id: int,
    product_id: int,
    version_number: int,
    db: Session = Depends(get_db),
    client_id: int = Depends(get_current_client_id),
):
    _require_campaign_for_client(db, campaign_id, client_id)
    _require_product_for_client(db, product_id, client_id)

    estimated = estimate_preview_variant_count(db, campaign_id, version_number)
    if estimated == 0:
        return _credits_response(
            db,
            client_id,
            status="completed",
            ad_variant_ids=[],
            credits_charged=0,
        )

    reserve_credits(db, client_id, estimated)
    ad_variant_ids: list[int] = []
    try:
        ad_variant_ids = await run_generate_campaign_preview(
            campaign_id, product_id, version_number
        )
    except AdJobClientError as e:
        refund_credits(db, client_id, estimated - len(ad_variant_ids))
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception:
        refund_credits(db, client_id, estimated - len(ad_variant_ids))
        raise
    else:
        refund_credits(db, client_id, estimated - len(ad_variant_ids))

    return _credits_response(
        db,
        client_id,
        status="completed",
        ad_variant_ids=ad_variant_ids,
        credits_charged=len(ad_variant_ids),
    )


@router.post("/generate-campaign-ad-variants")
async def generate_campaign_ad_variants(
    campaign_id: int,
    product_id: int,
    version_number: int,
    db: Session = Depends(get_db),
    client_id: int = Depends(get_current_client_id),
):
    _require_campaign_for_client(db, campaign_id, client_id)
    _require_product_for_client(db, product_id, client_id)

    estimated = estimate_batch_variant_count(db, campaign_id, version_number)
    if estimated == 0:
        return _credits_response(
            db,
            client_id,
            status="completed",
            message="No ad variants to generate",
        )

    reserve_credits(db, client_id, estimated)
    try:
        batch_id = await run_generate_campaign_ad_variants(
            campaign_id, product_id, version_number
        )
    except AdJobClientError as e:
        refund_credits(db, client_id, estimated)
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception:
        refund_credits(db, client_id, estimated)
        raise

    if batch_id is None:
        refund_credits(db, client_id, estimated)
        return _credits_response(
            db,
            client_id,
            status="completed",
            message="No ad variants to generate",
            credits_reserved=0,
        )

    return _credits_response(
        db,
        client_id,
        status="completed",
        batch_id=str(batch_id),
        message="Campaign ad variants enqueued",
        jobs_enqueued=estimated,
        credits_reserved=estimated,
    )
