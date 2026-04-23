"""Errors for ad job execution (sync HTTP routes map some to 4xx)."""


class AdJobClientError(Exception):
    """Bad input or fixable configuration (e.g. missing product image). Maps to HTTP 400 on `/run-ad-job`."""
