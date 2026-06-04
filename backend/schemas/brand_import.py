"""Pydantic schemas for business URL brand import (analyze + apply)."""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator


class BrandImportAnalyzeRequest(BaseModel):
    url: str = Field(..., min_length=1, max_length=2000)

    @field_validator("url")
    @classmethod
    def strip_url(cls, v: str) -> str:
        return v.strip()


class TestimonialExtract(BaseModel):
    quote: str
    attribution: Optional[str] = None


class FaqExtract(BaseModel):
    question: str
    answer: str


class PricingExtract(BaseModel):
    display: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None


class ImageCandidate(BaseModel):
    url: str
    alt: Optional[str] = None
    linked_product_slug: Optional[str] = None


class BrandExtract(BaseModel):
    name: Optional[str] = None
    tone: Optional[Literal["formal", "playful", "bold", "minimal"]] = None
    tone_notes: Optional[str] = None
    value_propositions: list[str] = Field(default_factory=list)
    target_customer_assumptions: Optional[str] = None
    testimonials: list[TestimonialExtract] = Field(default_factory=list)
    faqs: list[FaqExtract] = Field(default_factory=list)
    offers: list[str] = Field(default_factory=list)
    hero_image_url: Optional[str] = None


class ProductExtract(BaseModel):
    name: str
    description: Optional[str] = None
    product_url: Optional[str] = None
    value_propositions: list[str] = Field(default_factory=list)
    pricing: Optional[PricingExtract] = None
    offers: list[str] = Field(default_factory=list)
    image_candidates: list[ImageCandidate] = Field(default_factory=list)


class PageExtractionMeta(BaseModel):
    url: str
    page_type: str
    text_chars: int
    text_raw_chars: int = 0
    text_extractor: str = "beautifulsoup"
    had_json_ld: bool = False
    json_ld_types: list[str] = Field(default_factory=list)
    structured_product_count: int = 0
    image_candidate_count: int = 0


class ExtractionMeta(BaseModel):
    pages: list[PageExtractionMeta] = Field(default_factory=list)
    structured_product_seeds: int = 0


class BrandImportPreview(BaseModel):
    source_url: str
    fetched_pages: list[str] = Field(default_factory=list)
    brand: BrandExtract = Field(default_factory=BrandExtract)
    products: list[ProductExtract] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    confidence: Literal["low", "medium", "high"] = "medium"
    extraction_meta: Optional[ExtractionMeta] = None


class BrandImportAnalyzeResponse(BaseModel):
    preview: BrandImportPreview


class BrandImportApplyRequest(BaseModel):
    preview: BrandImportPreview
    create_products: bool = True
    selected_product_indexes: list[int] = Field(default_factory=list)
    selected_images: dict[str, list[int]] = Field(
        default_factory=dict,
        description="Map product index (string key) to list of image_candidates indexes",
    )
    merge_onboarding_traits: bool = False


class ProductImportResult(BaseModel):
    product_id: int
    name: str
    image_errors: list[str] = Field(default_factory=list)


class BrandImportApplyResponse(BaseModel):
    brand_profile_saved: bool
    products_created: list[ProductImportResult] = Field(default_factory=list)
    traits_updated: bool = False


class BrandImportLimitsResponse(BaseModel):
    enabled: bool
    max_analyzes_per_hour: int
    remaining_analyzes_this_hour: int
