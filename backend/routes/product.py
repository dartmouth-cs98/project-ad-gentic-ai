"""API routes for products — full CRUD + image upload/delete endpoints (JWT-protected)."""

import json
import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from azure.storage.blob import (
    BlobClient,
    BlobSasPermissions,
    ContainerClient,
    ContentSettings,
    generate_blob_sas,
)

from database import get_db
from dependencies import get_current_client_id
from schemas.product import ProductCreate, ProductUpdate, ProductResponse
from crud.product import (
    get_product,
    get_products,
    create_product,
    update_product,
    delete_product,
)
from utils.product_image_names import parse_product_image_entries

router = APIRouter()

CONTAINER_NAME = "product-images"
SAS_EXPIRY_HOURS = 1
MAX_IMAGES_PER_PRODUCT = 5

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB


def _parse_conn_str(conn_str: str) -> tuple[str, str]:
    """Extract account_name and account_key from an Azure Storage connection string."""
    parts = dict(part.split("=", 1) for part in conn_str.split(";") if "=" in part)
    return parts["AccountName"], parts["AccountKey"]


def _sign_url(url: str, blob_name: str, account_name: str, account_key: str) -> str:
    """Append a SAS token to a single blob URL."""
    sas_token = generate_blob_sas(
        account_name=account_name,
        container_name=CONTAINER_NAME,
        blob_name=blob_name,
        account_key=account_key,
        permission=BlobSasPermissions(read=True),
        expiry=datetime.now(timezone.utc) + timedelta(hours=SAS_EXPIRY_HOURS),
    )
    return f"{url}?{sas_token}"


def _sign_product(product) -> ProductResponse:
    """Convert ORM product to response, signing each image URL with a SAS token."""
    resp = ProductResponse.model_validate(product)
    if not resp.image_urls or not resp.image_names:
        return resp
    conn_str = os.getenv("AZURE_STORAGE_CONNECTION_STRING", "").strip()
    if not conn_str:
        return resp
    account_name, account_key = _parse_conn_str(conn_str)
    resp.image_urls = [
        _sign_url(url, name, account_name, account_key)
        for url, name in zip(resp.image_urls, resp.image_names)
    ]
    return resp


def _get_container(conn_str: str) -> ContainerClient:
    container = ContainerClient.from_connection_string(
        conn_str=conn_str,
        container_name=CONTAINER_NAME,
    )
    if not container.exists():
        container.create_container()
    return container


# ---------- CRUD routes ----------

@router.get("/", response_model=list[ProductResponse])
def list_products(
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    client_id: int = Depends(get_current_client_id),
):
    products = get_products(db, business_client_id=client_id, is_active=is_active, skip=skip, limit=limit)
    return [_sign_product(p) for p in products]


@router.get("/{product_id}", response_model=ProductResponse)
def read_product(
    product_id: int,
    db: Session = Depends(get_db),
    client_id: int = Depends(get_current_client_id),
):
    product = get_product(db, product_id)
    if product is None or product.business_client_id != client_id:
        raise HTTPException(status_code=404, detail="Product not found")
    return _sign_product(product)


@router.post("/", response_model=ProductResponse, status_code=201)
def create_new_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    client_id: int = Depends(get_current_client_id),
):
    return _sign_product(create_product(db, client_id, data))


@router.put("/{product_id}", response_model=ProductResponse)
def update_existing_product(
    product_id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    client_id: int = Depends(get_current_client_id),
):
    product = get_product(db, product_id)
    if product is None or product.business_client_id != client_id:
        raise HTTPException(status_code=404, detail="Product not found")
    return _sign_product(update_product(db, product_id, data))


@router.delete("/{product_id}", status_code=204)
def remove_product(
    product_id: int,
    db: Session = Depends(get_db),
    client_id: int = Depends(get_current_client_id),
):
    product = get_product(db, product_id)
    if product is None or product.business_client_id != client_id:
        raise HTTPException(status_code=404, detail="Product not found")
    delete_product(db, product_id)


# ---------- Image upload ----------

@router.post("/{product_id}/upload-image", response_model=ProductResponse)
async def upload_product_images(
    product_id: int,
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    client_id: int = Depends(get_current_client_id),
):
    """Upload one or more product images (appended to the existing list, max 5 total)."""
    product = get_product(db, product_id)
    if product is None or product.business_client_id != client_id:
        raise HTTPException(status_code=404, detail="Product not found")

    if not files:
        raise HTTPException(status_code=400, detail="No files provided.")

    # Parse existing lists from DB (handles legacy plain-URL rows)
    existing_urls = parse_product_image_entries(product.image_url)
    existing_names = parse_product_image_entries(product.image_name)

    slots_remaining = MAX_IMAGES_PER_PRODUCT - len(existing_urls)
    if slots_remaining <= 0:
        raise HTTPException(
            status_code=400,
            detail=f"Product already has {MAX_IMAGES_PER_PRODUCT} images. Delete one first.",
        )
    if len(files) > slots_remaining:
        raise HTTPException(
            status_code=400,
            detail=f"Too many files. You can add {slots_remaining} more image(s) (max {MAX_IMAGES_PER_PRODUCT} total).",
        )

    conn_str = os.getenv("AZURE_STORAGE_CONNECTION_STRING", "").strip()
    if not conn_str:
        raise HTTPException(status_code=500, detail="Storage not configured.")

    _get_container(conn_str)

    new_urls: list[str] = []
    new_names: list[str] = []

    for file in files:
        content_type = file.content_type or ""
        if content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported image type '{content_type}' for file '{file.filename}'. Allowed: {', '.join(ALLOWED_IMAGE_TYPES.keys())}",
            )
        image_bytes = await file.read()
        if len(image_bytes) > MAX_IMAGE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File '{file.filename}' exceeds 10 MB limit.",
            )

        ext = ALLOWED_IMAGE_TYPES[content_type]
        blob_name = f"{uuid.uuid4().hex}{ext}"

        blob_client = BlobClient.from_connection_string(
            conn_str=conn_str,
            container_name=CONTAINER_NAME,
            blob_name=blob_name,
        )
        blob_client.upload_blob(
            image_bytes,
            overwrite=True,
            content_settings=ContentSettings(content_type=content_type),
        )
        new_urls.append(blob_client.url)
        new_names.append(blob_name)

    updated = update_product(
        db,
        product_id,
        ProductUpdate(
            name=product.name,
            image_url=json.dumps(existing_urls + new_urls),
            image_name=json.dumps(existing_names + new_names),
        ),
    )
    return _sign_product(updated)


# ---------- Image delete ----------

@router.delete("/{product_id}/images/{blob_name}", response_model=ProductResponse)
def delete_product_image(
    product_id: int,
    blob_name: str,
    db: Session = Depends(get_db),
    client_id: int = Depends(get_current_client_id),
):
    """Remove a single image from a product by its blob name."""
    product = get_product(db, product_id)
    if product is None or product.business_client_id != client_id:
        raise HTTPException(status_code=404, detail="Product not found")

    existing_urls = parse_product_image_entries(product.image_url)
    existing_names = parse_product_image_entries(product.image_name)

    if blob_name not in existing_names:
        raise HTTPException(status_code=404, detail="Image not found on this product.")

    # Delete from Azure Blob Storage
    conn_str = os.getenv("AZURE_STORAGE_CONNECTION_STRING", "").strip()
    if conn_str:
        try:
            blob_client = BlobClient.from_connection_string(
                conn_str=conn_str,
                container_name=CONTAINER_NAME,
                blob_name=blob_name,
            )
            blob_client.delete_blob()
        except Exception:
            pass  # Don't block the DB update if blob deletion fails

    idx = existing_names.index(blob_name)
    new_urls = existing_urls[:idx] + existing_urls[idx + 1:]
    new_names = existing_names[:idx] + existing_names[idx + 1:]

    updated = update_product(
        db,
        product_id,
        ProductUpdate(
            name=product.name,
            image_url=json.dumps(new_urls) if new_urls else None,
            image_name=json.dumps(new_names) if new_names else None,
        ),
    )
    return _sign_product(updated)
