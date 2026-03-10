"""API routes for products — full CRUD + image upload endpoints (JWT-protected)."""

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

router = APIRouter()

CONTAINER_NAME = "product-images"
SAS_EXPIRY_HOURS = 1


def _parse_conn_str(conn_str: str) -> tuple[str, str]:
    """Extract account_name and account_key from an Azure Storage connection string."""
    parts = dict(part.split("=", 1) for part in conn_str.split(";") if "=" in part)
    return parts["AccountName"], parts["AccountKey"]


def _sign_product(product) -> ProductResponse:
    """Convert ORM product to response with a time-limited SAS URL for the image."""
    resp = ProductResponse.model_validate(product, from_attributes=True)
    if not resp.image_url or not resp.image_name:
        return resp
    conn_str = os.getenv("AZURE_STORAGE_CONNECTION_STRING", "").strip()
    if not conn_str:
        return resp
    account_name, account_key = _parse_conn_str(conn_str)
    sas_token = generate_blob_sas(
        account_name=account_name,
        container_name=CONTAINER_NAME,
        blob_name=resp.image_name,
        account_key=account_key,
        permission=BlobSasPermissions(read=True),
        expiry=datetime.now(timezone.utc) + timedelta(hours=SAS_EXPIRY_HOURS),
    )
    resp.image_url = f"{resp.image_url}?{sas_token}"
    return resp


@router.get("/", response_model=list[ProductResponse])
def list_products(
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    client_id: int = Depends(get_current_client_id),
):
    """Get all products for the authenticated client, with optional is_active filter."""
    products = get_products(
        db,
        business_client_id=client_id,
        is_active=is_active,
        skip=skip,
        limit=limit,
    )
    return [_sign_product(p) for p in products]


@router.get("/{product_id}", response_model=ProductResponse)
def read_product(
    product_id: int,
    db: Session = Depends(get_db),
    client_id: int = Depends(get_current_client_id),
):
    """Get a single product by ID. Returns 404 if not found or not owned by the client."""
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
    """Create a new product for the authenticated client."""
    return _sign_product(create_product(db, client_id, data))


@router.put("/{product_id}", response_model=ProductResponse)
def update_existing_product(
    product_id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    client_id: int = Depends(get_current_client_id),
):
    """Update an existing product. Returns 404 if not found or not owned by the client."""
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
    """Delete a product by ID. Returns 404 if not found or not owned by the client."""
    product = get_product(db, product_id)
    if product is None or product.business_client_id != client_id:
        raise HTTPException(status_code=404, detail="Product not found")
    delete_product(db, product_id)


ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/{product_id}/upload-image", response_model=ProductResponse)
async def upload_product_image(
    product_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    client_id: int = Depends(get_current_client_id),
):
    """Upload or replace a product image. Stores in Azure Blob Storage (product-images container)."""
    product = get_product(db, product_id)
    if product is None or product.business_client_id != client_id:
        raise HTTPException(status_code=404, detail="Product not found")

    content_type = file.content_type or ""
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image type: {content_type}. Allowed: {', '.join(ALLOWED_IMAGE_TYPES.keys())}",
        )

    image_bytes = await file.read()
    if len(image_bytes) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail="Image must be under 10 MB.")

    ext = ALLOWED_IMAGE_TYPES[content_type]
    blob_name = f"{uuid.uuid4().hex}{ext}"

    conn_str = os.getenv("AZURE_STORAGE_CONNECTION_STRING", "").strip()
    if not conn_str:
        raise HTTPException(status_code=500, detail="Storage not configured.")

    container = ContainerClient.from_connection_string(
        conn_str=conn_str,
        container_name="product-images",
    )
    if not container.exists():
        container.create_container()

    blob_client = BlobClient.from_connection_string(
        conn_str=conn_str,
        container_name="product-images",
        blob_name=blob_name,
    )
    blob_client.upload_blob(
        image_bytes,
        overwrite=True,
        content_settings=ContentSettings(content_type=content_type),
    )

    updated = update_product(
        db,
        product_id,
        ProductUpdate(
            name=product.name,
            image_url=blob_client.url,
            image_name=blob_name,
        ),
    )
    return _sign_product(updated)