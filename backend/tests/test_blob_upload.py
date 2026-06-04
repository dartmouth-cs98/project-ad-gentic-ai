#!/usr/bin/env python3
"""
Test script for Azure Blob Storage upload.
Run from backend directory:
    python -m pytest tests/test_blob_upload.py -v
    or:  python tests/test_blob_upload.py

Requires .env with AZURE_STORAGE_CONNECTION_STRING set.
Uses the same container (ad-videos) and naming pattern as the ad job worker.
"""
import os
import sys
import uuid
from pathlib import Path

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

from dotenv import load_dotenv
from azure.storage.blob import BlobClient

load_dotenv()

CONTAINER = "ad-videos"
TEST_BLOB_NAME = f"ad-videos/test-{uuid.uuid4().hex}.txt"
TEST_CONTENT = b"test upload from backend/tests/test_blob_upload.py"


def main() -> None:
    conn_str = os.getenv("AZURE_STORAGE_CONNECTION_STRING", "").strip()
    if not conn_str or conn_str.startswith("YOUR_"):
        print("ERROR: Set AZURE_STORAGE_CONNECTION_STRING in .env (see .env.example)")
        sys.exit(1)

    print(f"Uploading test blob to container '{CONTAINER}' as '{TEST_BLOB_NAME}' ...")
    blob_client = BlobClient.from_connection_string(
        conn_str=conn_str,
        container_name=CONTAINER,
        blob_name=TEST_BLOB_NAME,
    )
    blob_client.upload_blob(TEST_CONTENT, overwrite=True)
    url = blob_client.url
    print(f"Upload OK. URL: {url}")

    # Verify: blob exists and content matches
    download = blob_client.download_blob()
    downloaded = download.readall()
    if downloaded != TEST_CONTENT:
        print("ERROR: Downloaded content does not match uploaded content")
        sys.exit(1)
    print("Verified: downloaded content matches.")

    # Optional: delete the test blob so the container stays clean
    blob_client.delete_blob()
    print("Test blob deleted. Blob storage is working.")


if __name__ == "__main__":
    main()
