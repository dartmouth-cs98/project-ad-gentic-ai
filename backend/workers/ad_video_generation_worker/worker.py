import asyncio
import io
import os

from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv()

POLL_INTERVAL_SECONDS = 5
MAX_POLL_ATTEMPTS = 120  # 10 minutes at 5s interval
TERMINAL_FAILURE_STATUS = "failed"


async def generate_ad_video(
    script: str,
    product_image_bytes: bytes,
    product_image_type: str,
    product_image_filename: str,
) -> bytes:
    api_key = os.getenv("VIDEO_API_KEY", "").strip()
    if not api_key or api_key.upper() == "YOUR_API_KEY":
        raise RuntimeError("Video generation env vars not configured.")

    video_client = AsyncOpenAI(api_key=os.getenv("VIDEO_API_KEY"))
    
    creation_response = await video_client.videos.create(
        prompt=script,
        size="720x1280",
        seconds=8,
        input_reference=(product_image_filename, io.BytesIO(product_image_bytes), product_image_type),
    )

    job_id = creation_response.id
    job_status = creation_response
    attempt = 0

    while job_status.status != "completed":
        if job_status.status in TERMINAL_FAILURE_STATUSES:
            raise RuntimeError(
                f"Video generation job {job_id} ended with status '{job_status.status}'."
            )
        attempt += 1
        if attempt >= MAX_POLL_ATTEMPTS:
            raise RuntimeError(
                f"Video generation job {job_id} did not complete within {MAX_POLL_ATTEMPTS * POLL_INTERVAL_SECONDS}s."
            )
        await asyncio.sleep(POLL_INTERVAL_SECONDS)
        job_status = await video_client.videos.retrieve(id=job_id)

    download_response = await video_client.videos.download_content(id=job_id)
    ad_video_bytes = await download_response.aread()


    return ad_video_bytes
