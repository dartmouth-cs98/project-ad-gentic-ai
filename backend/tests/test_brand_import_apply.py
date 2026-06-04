"""Apply brand import to traits and products."""

import json
import os
import sys
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost")

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base
from models.business_client import BusinessClient
from models.product import Product
from schemas.brand_import import (
    BrandExtract,
    BrandImportApplyRequest,
    BrandImportPreview,
    ImageCandidate,
    ProductExtract,
)
from services.brand_import.service import apply_brand_import
from services.storage.product_images import ProductImageError

_original_product_schema = getattr(Product.__table__, "schema", None)
_original_client_schema = getattr(BusinessClient.__table__, "schema", None)

engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_db():
    for table in (Product.__table__, BusinessClient.__table__):
        if hasattr(table, "schema"):
            table.schema = None
    Base.metadata.create_all(bind=engine, tables=[BusinessClient.__table__, Product.__table__])
    yield
    Base.metadata.drop_all(bind=engine, tables=[BusinessClient.__table__, Product.__table__])
    if _original_product_schema is not None:
        Product.__table__.schema = _original_product_schema
    if _original_client_schema is not None:
        BusinessClient.__table__.schema = _original_client_schema


@pytest.fixture
def db_session():
    session = SessionLocal()
    client = BusinessClient(
        email="import@test.com",
        password_hash="x",
        business_name="Import Test Co",
        subscription_tier="basic",
        credits_balance=10,
    )
    session.add(client)
    session.commit()
    session.refresh(client)
    try:
        yield session, client.id
    finally:
        session.close()


@pytest.mark.asyncio
async def test_apply_rejects_too_many_products(db_session):
    db, client_id = db_session
    preview = BrandImportPreview(
        source_url="https://example.com",
        products=[ProductExtract(name=f"Product {i}") for i in range(15)],
        warnings=[],
        confidence="low",
    )
    with pytest.raises(ValueError, match="maximum"):
        await apply_brand_import(
            db,
            client_id,
            BrandImportApplyRequest(preview=preview, create_products=True),
        )


@pytest.mark.asyncio
async def test_apply_merges_traits_and_creates_product(db_session):
    db, client_id = db_session
    preview = BrandImportPreview(
        source_url="https://example.com",
        fetched_pages=["https://example.com"],
        brand=BrandExtract(
            name="Example Co",
            value_propositions=["Fast widgets"],
            target_customer_assumptions="Busy pros",
        ),
        products=[
            ProductExtract(
                name="Widget Pro",
                description="Our flagship widget",
                product_url="https://example.com/widget",
                image_candidates=[ImageCandidate(url="https://example.com/img.png", alt="widget")],
            )
        ],
        warnings=[],
        confidence="medium",
    )
    with patch(
        "services.brand_import.service.download_and_upload_product_image",
        new_callable=AsyncMock,
        return_value=("https://blob/img.png", "abc.png"),
    ):
        result = await apply_brand_import(
            db,
            client_id,
            BrandImportApplyRequest(
                preview=preview,
                create_products=True,
                selected_product_indexes=[0],
                selected_images={"0": [0]},
                merge_onboarding_traits=True,
            ),
        )

    assert result.traits_updated is True
    assert len(result.products_created) == 1
    assert result.products_created[0].product_id > 0

    refreshed_client = db.get(BusinessClient, client_id)
    traits = json.loads(refreshed_client.traits)
    assert traits["brand_profile"]["source_url"] == "https://example.com"
    assert traits["target_customer"] == "Busy pros"

    product = db.get(Product, result.products_created[0].product_id)
    assert product.name == "Widget Pro"
    assert json.loads(product.image_name) == ["abc.png"]


@pytest.mark.asyncio
async def test_apply_honors_explicit_empty_image_list(db_session):
    db, client_id = db_session
    preview = BrandImportPreview(
        source_url="https://example.com",
        products=[
            ProductExtract(
                name="Widget Pro",
                image_candidates=[ImageCandidate(url="https://example.com/img.png", alt="widget")],
            )
        ],
        warnings=[],
        confidence="medium",
    )
    with patch(
        "services.brand_import.service.download_and_upload_product_image",
        new_callable=AsyncMock,
    ) as mock_download:
        result = await apply_brand_import(
            db,
            client_id,
            BrandImportApplyRequest(
                preview=preview,
                create_products=True,
                selected_product_indexes=[0],
                selected_images={"0": []},
            ),
        )

    assert len(result.products_created) == 1
    mock_download.assert_not_awaited()
    product = db.get(Product, result.products_created[0].product_id)
    assert product.image_name is None or json.loads(product.image_name) == []


@pytest.mark.asyncio
async def test_apply_defaults_to_first_image_when_key_omitted(db_session):
    db, client_id = db_session
    preview = BrandImportPreview(
        source_url="https://example.com",
        products=[
            ProductExtract(
                name="Widget Pro",
                image_candidates=[ImageCandidate(url="https://example.com/img.png", alt="widget")],
            )
        ],
        warnings=[],
        confidence="medium",
    )
    with patch(
        "services.brand_import.service.download_and_upload_product_image",
        new_callable=AsyncMock,
        return_value=("https://blob/img.png", "abc.png"),
    ) as mock_download:
        result = await apply_brand_import(
            db,
            client_id,
            BrandImportApplyRequest(
                preview=preview,
                create_products=True,
                selected_product_indexes=[0],
            ),
        )

    assert len(result.products_created) == 1
    mock_download.assert_awaited_once()


@pytest.mark.asyncio
async def test_apply_records_image_http_failure_without_aborting(db_session):
    db, client_id = db_session
    preview = BrandImportPreview(
        source_url="https://example.com",
        products=[
            ProductExtract(
                name="Widget Pro",
                image_candidates=[ImageCandidate(url="https://cdn.example.com/missing.png", alt="widget")],
            )
        ],
        warnings=[],
        confidence="medium",
    )
    with patch(
        "services.brand_import.service.download_and_upload_product_image",
        new_callable=AsyncMock,
        side_effect=ProductImageError("Remote image request failed with HTTP 404"),
    ):
        result = await apply_brand_import(
            db,
            client_id,
            BrandImportApplyRequest(
                preview=preview,
                create_products=True,
                selected_product_indexes=[0],
                selected_images={"0": [0]},
            ),
        )

    assert len(result.products_created) == 1
    assert result.products_created[0].product_id > 0
    assert result.products_created[0].image_errors == [
        "https://cdn.example.com/missing.png: Remote image request failed with HTTP 404"
    ]
    product = db.get(Product, result.products_created[0].product_id)
    assert product.name == "Widget Pro"
    assert product.image_name is None or json.loads(product.image_name) == []
