from fastapi import APIRouter

router = APIRouter()

@router.post("/schedule-ad-job")
async def schedule_ad_job(ad_job: AdJob):
    return {
        "service": "Ad Job Scheduler",
        "message": "Ad job scheduled",
        "description": "Scheduler for AI ad generation"
    }
