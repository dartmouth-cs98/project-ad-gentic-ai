"""API routes for products — full CRUD endpoints (JWT-protected)."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

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


@router.get("/", response_model=list[ProductResponse])
def list_products(
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    client_id: int = Depends(get_current_client_id),
):
    """Get all products for the authenticated client, with optional is_active filter."""
    return get_products(
        db,
        business_client_id=client_id,
        is_active=is_active,
        skip=skip,
        limit=limit,
    )


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
    return product


@router.post("/", response_model=ProductResponse, status_code=201)
def create_new_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    client_id: int = Depends(get_current_client_id),
):
    """Create a new product for the authenticated client."""
    return create_product(db, client_id, data)


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
    return update_product(db, product_id, data)


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