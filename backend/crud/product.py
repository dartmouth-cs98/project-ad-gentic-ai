"""CRUD operations for products table."""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from models.product import Product
from schemas.product import ProductCreate, ProductUpdate


def get_product(db: Session, product_id: int) -> Optional[Product]:
    """Return a single product by ID, or None."""
    return db.get(Product, product_id)


def get_products(
    db: Session,
    business_client_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
) -> list[Product]:
    """Return a list of products with optional filters."""
    query = select(Product)
    if business_client_id is not None:
        query = query.where(Product.business_client_id == business_client_id)
    if is_active is not None:
        query = query.where(Product.is_active == is_active)
    query = query.order_by(Product.created_at.desc()).offset(skip).limit(limit)
    return list(db.scalars(query).all())


def create_product(db: Session, client_id: int, data: ProductCreate) -> Product:
    """Insert a new product and return it."""
    payload = data.model_dump()
    product = Product(**payload, business_client_id=client_id)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def update_product(
    db: Session,
    product_id: int,
    data: ProductUpdate,
) -> Optional[Product]:
    """Update an existing product. Returns None if not found."""
    product = db.get(Product, product_id)
    if product is None:
        return None
    payload = data.model_dump(exclude_unset=True)
    for field, value in payload.items():
        setattr(product, field, value)
    product.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product_id: int) -> bool:
    """Delete a product by ID. Returns True if deleted, False if not found."""
    product = db.get(Product, product_id)
    if product is None:
        return False
    db.delete(product)
    db.commit()
    return True