from fastapi import APIRouter

router = APIRouter()

@router.get("/hello")
async def hello():
    return {
        "service": "Script Creation Worker",
        "message": "Hello from Script Creation Worker!",
        "description": "Task processing worker for creating ad scripts using AI"
    }
