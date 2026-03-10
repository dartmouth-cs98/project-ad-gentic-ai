from __future__ import annotations

import os
import json

from dotenv import load_dotenv
from openai import AsyncOpenAI
from xai_sdk import Client
from xai_sdk.chat import system, user, image

load_dotenv()


def _build_script_prompt(
    product_name: str,
    product_description: str,
    consumer_profile_text: str,
    campaign_brief: str = "",
) -> str:
    """Build the ad script generation prompt with product and consumer context."""
    return f"""You are a creative advertising director and consumer psychologist. Based on the product and audience profile below, create an entertaining short-form video concept that people would actually want to watch and share.
    Tailor the ad specifically for the following consumer based on their demographics, interests, personality, values and other characteristics: {consumer_profile_text}
    Don't explicitly mention the consumer profile in the script, but use it to tailor the ad to them.

    You will be provided with an image that includes a reference to the product, but the entire ad should be a creative ad video that gets created and scripted for. The first frame is going to be just the product, but you need to change away and then go into the rest of the video
  
    Product Name: {product_name}
    Product Description: {product_description or 'Not provided'}

    Campaign Brief: {campaign_brief}

    Create a short video script designed to entertain first, not sell. Think about:
    1. What format would this audience actually engage with? (POV, reaction video, "day in the life", unexpected hook, text-on-screen with trending audio, etc.)
    2. What emotional hook or relatable moment makes someone stop scrolling?
    3. How can you showcase the product naturally within a story, joke, or insight rather than selling it directly?
    4. What would make this person laugh, say "same", or immediately send it to a friend?

    Requirements:
    1. 8 seconds exactly
    2. Specify frame-by-frame detail (what the viewer should see/feel) using the reference image of the product as visual guidance
    3. Make it feel creator-made, not brand-made
    4. No obvious call-to-action or sales language

    Be bold with the creative direction. Surprise me with the format you choose.
    Remember: Every second matters. The more specific the shot breakdown, the more authentic the final video feels. No text overlays ever. All dialogue must finish by the 8-second mark (can trail off naturally)."""


async def generate_ad_script(
    product_name: str,
    product_description: str,
    product_image_data_url: str,
    consumer_traits_string: str,
    campaign_brief: str = "",
) -> str:
    api_key = os.getenv("SCRIPT_API_KEY", "").strip()
    model = os.getenv("SCRIPT_MODEL", "").strip()
    base_url = os.getenv("SCRIPT_BASE_URL", "").strip()
    script_client = AsyncOpenAI(api_key=api_key, base_url=base_url)

    prompt = _build_script_prompt(product_name, product_description, consumer_traits_string, campaign_brief)


    response = await script_client.responses.create(
        model=model,
        instructions="You are an expert advertising creative director specializing in short-form video ads.",
        input=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "input_text",
                        "text": prompt
                    },
                    {
                        "type": "input_image",
                        "image_url": product_image_data_url,
                        "detail": "high"
                    }
                ]
            }
        ],
        max_output_tokens=2000
    )

    # Responses API: output is a list of items; each item has content (list) with text.
    if not response.output or len(response.output) == 0:
        raise ValueError("Script API returned no output")
    first_output = response.output[0]
    if not getattr(first_output, "content", None) or len(first_output.content) == 0:
        raise ValueError("Script API returned output with no content")
    script = first_output.content[0].text
    return script

def batch_generate_ad_scripts(product_name: str, product_description: str, consumers: list["Consumer"], product_image_data_url: str, campaign_brief: str):
    api_key = os.getenv("SCRIPT_API_KEY", "").strip()
    model = os.getenv("SCRIPT_MODEL", "").strip()
    base_url = os.getenv("SCRIPT_BASE_URL", "").strip()
    batch_script_client = Client(api_key=api_key)

    batch = batch_script_client.batch.create(batch_name="batch_generate_ad_scripts")
    
    batch_requests = []
    for consumer in consumers:
        chat = batch_script_client.chat.create(
            model=model,
            batch_request_id=consumer.id,
        )
        traits_dict = json.loads(consumer.traits) if consumer.traits else {}
        consumer_traits_string = "\n".join(f"{k}: {v}" for k, v in traits_dict.items())
        prompt = _build_script_prompt(product_name, product_description, consumer_traits_string, campaign_brief)
        chat.append(system("You are an expert advertising creative director specializing in short-form video ads."))
        chat.append(user(prompt, image(image_url=product_image_data_url, detail="high")))

        batch_requests.append(chat)
    batch_script_client.batch.add(batch_id=batch.batch_id, batch_requests=batch_requests)
    return batch.batch_id