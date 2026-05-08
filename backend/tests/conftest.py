"""Pytest configuration and shared fixtures."""

import pytest


def pytest_configure(config):
    """Enable pytest-asyncio auto mode for async tests."""
    config.addinivalue_line("markers", "asyncio: mark test as an async test (asyncio_mode=auto)")
