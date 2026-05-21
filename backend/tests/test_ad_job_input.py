"""Tests for ad_jobs input_json helpers."""

import sys
from pathlib import Path

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

from utils.ad_job_input import campaign_id_from_job_input


def test_campaign_id_from_valid_json():
    assert campaign_id_from_job_input(
        '{"campaign_id": 12, "product_id": 1, "consumer_id": 3, "version_number": 1}'
    ) == 12


def test_campaign_id_from_partial_json():
    assert campaign_id_from_job_input('{"campaign_id": 99}') == 99


def test_campaign_id_from_invalid_json():
    assert campaign_id_from_job_input("not json") is None
    assert campaign_id_from_job_input("{}") is None
