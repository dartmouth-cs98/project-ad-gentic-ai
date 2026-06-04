import logging

from fastapi import APIRouter, HTTPException

from workers.ad_job_worker.errors import AdJobClientError
from workers.ad_job_worker.worker import execute_ad_job

router = APIRouter()
logger = logging.getLogger(__name__)

_LEGACY_GENERATION_DETAIL = (
    "This endpoint is retired. Use POST /ad-generation/generate-campaign-preview or "
    "/ad-generation/generate-campaign-ad-variants with JWT authentication."
)

@router.post("/run-ad-job")
async def run_ad_job(campaign_id: int, product_id: int, consumer_id: int, version_number: int):
    try:
        ad_variant_id = await execute_ad_job(campaign_id, product_id, consumer_id, version_number)
    except AdJobClientError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    return {"status": "completed", "ad_variant_id": ad_variant_id}


@router.post("/generate-campaign-preview", deprecated=True)
async def generate_campaign_preview(campaign_id: int, product_id: int, version_number: int):
    raise HTTPException(status_code=410, detail=_LEGACY_GENERATION_DETAIL)


@router.post("/generate-campaign-ad-variants", deprecated=True)
async def generate_campaign_ad_variants(campaign_id: int, product_id: int, version_number: int):
    raise HTTPException(status_code=410, detail=_LEGACY_GENERATION_DETAIL)

@router.get("/hello")
async def hello():
    logger.info("Hello from Ad Job Worker!")
    return {
        "service": "Ad Job Worker",
        "message": "Hello from Ad Job Worker!",
        "description": "Task processing worker for AI ad generation"
    }