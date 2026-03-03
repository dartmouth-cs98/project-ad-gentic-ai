"""OpenAI client factory."""

import os

from openai import AsyncOpenAI


def get_openai_client() -> AsyncOpenAI:
    """Return a configured OpenAI async client. Raises if key not set."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable is not set.")
    return AsyncOpenAI(api_key=api_key)
