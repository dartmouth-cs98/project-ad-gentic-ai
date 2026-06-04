"""Brand URL import — analyze and apply (JWT-protected)."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_client_id
from schemas.brand_import import (
    BrandImportAnalyzeRequest,
    BrandImportAnalyzeResponse,
    BrandImportApplyRequest,
    BrandImportApplyResponse,
    BrandImportLimitsResponse,
)
from services.brand_import.config import brand_import_enabled
from services.brand_import.llm_extract import BrandImportExtractionError
from services.brand_import.service import analyze_business_url, apply_brand_import, get_limits
from services.brand_import.url_validation import BrandImportUrlError

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/limits", response_model=BrandImportLimitsResponse)
def brand_import_limits(client_id: int = Depends(get_current_client_id)):
    data = get_limits(client_id)
    return BrandImportLimitsResponse(**data)


@router.post("/analyze", response_model=BrandImportAnalyzeResponse)
async def analyze_brand_url(
    body: BrandImportAnalyzeRequest,
    client_id: int = Depends(get_current_client_id),
):
    if not brand_import_enabled():
        raise HTTPException(status_code=503, detail="Brand import is disabled.")
    try:
        preview = await analyze_business_url(client_id, body.url)
    except BrandImportUrlError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except BrandImportExtractionError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("brand_import analyze failed client_id=%s", client_id)
        raise HTTPException(
            status_code=422,
            detail="Extraction failed. Check server logs for details.",
        ) from exc
    return BrandImportAnalyzeResponse(preview=preview)


@router.post("/apply", response_model=BrandImportApplyResponse)
async def apply_brand_url_import(
    body: BrandImportApplyRequest,
    db: Session = Depends(get_db),
    client_id: int = Depends(get_current_client_id),
):
    if not brand_import_enabled():
        raise HTTPException(status_code=503, detail="Brand import is disabled.")
    try:
        return await apply_brand_import(db, client_id, body)
    except ValueError as exc:
        detail = str(exc)
        status = 404 if "not found" in detail.lower() else 400
        raise HTTPException(status_code=status, detail=detail) from exc
    except Exception as exc:
        logger.exception("brand_import apply failed client_id=%s", client_id)
        raise HTTPException(status_code=400, detail="Apply failed.") from exc
