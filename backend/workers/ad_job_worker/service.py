from fastapi import APIRouter

router = APIRouter()

@router.get("/hello")
async def hello():
    return {
        "service": "Ad Job Worker",
        "message": "Hello from Ad Job Worker!",
        "description": "Task processing worker for AI ad generation"
    }
