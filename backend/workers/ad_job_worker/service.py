from fastapi import APIRouter

from workers.ad_job_worker.worker import (
    execute_ad_job,
    generate_campaign_preview as run_generate_campaign_preview,
    generate_campaign_ad_variants as run_generate_campaign_ad_variants,
)

router = APIRouter()


@router.post("/run-ad-job")
async def run_job(campaign_id: int, product_id: int, consumer_id: int, version_number: int):
    ad_variant_id = await execute_ad_job(campaign_id, product_id, consumer_id, version_number)
    return {"status": "completed", "ad_variant_id": ad_variant_id}


@router.get("/generate-campaign-preview")
async def generate_campaign_preview(campaign_id: int, product_id: int, version_number: int):
    ad_variant_ids = await run_generate_campaign_preview(campaign_id, product_id, version_number)
    return {"status": "completed", "ad_variant_ids": ad_variant_ids}


@router.post("/generate-campaign-ad-variants")
async def generate_campaign_ad_variants(campaign_id: int, product_id: int, version_number: int):
    batch_id = await run_generate_campaign_ad_variants(campaign_id, product_id, version_number)
    if batch_id is None:
        return {"status": "completed", "message": "No ad variants to generate"}
    return {"status": "completed", "batch_id": str(batch_id), "message": "Campaign ad variants enqueued"}

@router.get("/hello")
async def hello():
    return {
        "service": "Ad Job Worker",
        "message": "Hello from Ad Job Worker!",
        "description": "Task processing worker for AI ad generation"
    }