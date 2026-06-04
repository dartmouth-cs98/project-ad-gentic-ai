"""Tests for utils.product_image_names."""

import sys
from pathlib import Path

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

from utils.product_image_names import first_product_image_blob_name, parse_product_image_entries


def test_parse_json_array():
    assert parse_product_image_entries('["x.png", "y.png"]') == ["x.png", "y.png"]


def test_parse_json_scalar_string():
    assert parse_product_image_entries('"solo.jpg"') == ["solo.jpg"]


def test_parse_legacy_plain():
    assert parse_product_image_entries("legacy.png") == ["legacy.png"]


def test_first_matches_parse_first():
    assert first_product_image_blob_name('["a.jpg", "b.jpg"]') == "a.jpg"
    assert first_product_image_blob_name("only.png") == "only.png"
