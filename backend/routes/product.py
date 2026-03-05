"""API routes for products — full CRUD endpoints."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
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
    business_client_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    """Get all products, with optional filtering by business_client_id or is_active."""
    return get_products(
        db,
        business_client_id=business_client_id,
        is_active=is_active,
        skip=skip,
        limit=limit,
    )


@router.get("/{product_id}", response_model=ProductResponse)
def read_product(product_id: int, db: Session = Depends(get_db)):
    """Get a single product by ID."""
    product = get_product(db, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("/", response_model=ProductResponse, status_code=201)
def create_new_product(data: ProductCreate, db: Session = Depends(get_db)):
    """Create a new product."""
    return create_product(db, data)


@router.put("/{product_id}", response_model=ProductResponse)
def update_existing_product(
    product_id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db),
):
    """Update an existing product."""
    product = update_product(db, product_id, data)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.delete("/{product_id}", status_code=204)
def remove_product(product_id: int, db: Session = Depends(get_db)):
    """Delete a product by ID."""
    if not delete_product(db, product_id):
        raise HTTPException(status_code=404, detail="Product not found")