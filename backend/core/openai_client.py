"""OpenAI client factory."""

import os
from functools import lru_cache

from openai import AsyncOpenAI


@lru_cache(maxsize=None)
def get_openai_client() -> AsyncOpenAI:
    """Return a cached AsyncOpenAI instance. Raises if key not set.

    Cached so a single connection pool is shared across all requests.
    Call get_openai_client.cache_clear() in tests that need a fresh instance.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable is not set.")
    return AsyncOpenAI(api_key=api_key)
