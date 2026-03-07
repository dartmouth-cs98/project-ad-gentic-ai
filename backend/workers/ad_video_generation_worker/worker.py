import io
import os
import time

from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv()


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

    job_status = creation_response.status
    while getattr(job_status, "status", None) != "completed":
        time.sleep(5)
        job_status = await video_client.videos.retrieve(id=creation_response.id)

    download_response = await video_client.videos.download_content(id=creation_response.id)
    ad_video_bytes = await download_response.aread()


    return ad_video_bytes
