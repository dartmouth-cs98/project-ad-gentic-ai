"""Shared primitives reused across ad platform adapters.

Currently:
  - ``encryption`` — Fernet helpers (every platform stores tokens encrypted)
  - ``errors``     — ``PublishError`` base for routes to catch one error type

Publisher/Connection interfaces will land here once a second adapter exists
and the shape is no longer speculative.
"""
