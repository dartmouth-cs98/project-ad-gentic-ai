"""Pytest configuration and shared fixtures."""

import pytest


@pytest.fixture(autouse=True)
def _enable_veo_generation_for_tests(monkeypatch):
    """Most tests assume Veo routing is on; CI may set VEO_GENERATION_ENABLED=false."""
    monkeypatch.setenv("VEO_GENERATION_ENABLED", "true")


def pytest_configure(config):
    """Enable pytest-asyncio auto mode for async tests."""
    config.addinivalue_line("markers", "asyncio: mark test as an async test (asyncio_mode=auto)")
