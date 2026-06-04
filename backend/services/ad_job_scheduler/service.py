from fastapi import APIRouter

from schemas.ad_job import AdJobCreate

router = APIRouter()


@router.post("/schedule-ad-job")
async def schedule_ad_job(ad_job: AdJobCreate):
    return {
        "service": "Ad Job Scheduler",
        "message": "Ad job scheduled",
        "description": "Scheduler for AI ad generation"
    }
