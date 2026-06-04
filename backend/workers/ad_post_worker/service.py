from fastapi import APIRouter

router = APIRouter()

@router.get("/hello")
async def hello():
    return {
        "service": "Ad Post Worker",
        "message": "Hello from Ad Post Worker!",
        "description": "Task processing worker for posting ads to social media platforms"
    }
