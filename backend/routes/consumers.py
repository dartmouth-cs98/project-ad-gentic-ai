"""API routes for consumers — POST, GET all, CSV upload, and persona assignment."""

import csv
import io
import json
import logging
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from core.openai_client import get_openai_client
from crud.consumer import (
    create_consumer,
    create_consumers_bulk,
    filter_owned_consumer_ids,
    get_consumers,
    get_existing_emails,
    get_unassigned_consumer_ids,
)
from database import get_db
from dependencies import get_current_client_id
from schemas.consumer import (
    AssignPersonasRequest,
    ConsumerCreate,
    ConsumerCsvUploadResponse,
    ConsumerResponse,
    PersonaProcessingSummary,
)
from services.consumer_persona_processor.service import process_consumer_personas
from services.consumer_traits_description import (
    generate_consumer_traits_description,
    get_script_llm_client_and_model,
)

router = APIRouter()
logger = logging.getLogger(__name__)


def _to_response(consumer) -> dict:
    """Convert a Consumer ORM instance to a response-friendly dict,
    deserializing the traits JSON string back to a dict."""
    return {
        "id": consumer.id,
        "email": consumer.email,
        "phone": consumer.phone,
        "first_name": consumer.first_name,
        "last_name": consumer.last_name,
        "traits": json.loads(consumer.traits) if consumer.traits else None,
        "consumer_traits_description": consumer.consumer_traits_description,
        "primary_persona": consumer.primary_persona,
        "secondary_persona": consumer.secondary_persona,
        "persona_confidence": (
            float(consumer.persona_confidence) if consumer.persona_confidence is not None else None
        ),
        "persona_assigned_at": consumer.persona_assigned_at,
        "created_at": consumer.created_at,
        "updated_at": consumer.updated_at,
    }


@router.get("/", response_model=list[ConsumerResponse])
def list_consumers(
    skip: int = 0,
    limit: int = 100,
    persona_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    client_id: int = Depends(get_current_client_id),
):
    """Get consumers for the authenticated client.

    Pass persona_id to filter by category — returns consumers where
    primary OR secondary persona matches.
    """
    consumers = get_consumers(
        db, client_id=client_id, skip=skip, limit=limit, persona_id=persona_id
    )
    return [_to_response(c) for c in consumers]


@router.post("/upload-csv", response_model=ConsumerCsvUploadResponse)
async def upload_consumers_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    client_id: int = Depends(get_current_client_id),
):
    """Upload a CSV file to bulk-create consumers for the authenticated client."""
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are accepted.")

    contents = await file.read()
    try:
        text = contents.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be UTF-8 encoded.")

    reader = csv.DictReader(io.StringIO(text))

    required_cols = {"email", "phone", "first_name", "last_name", "traits"}
    if reader.fieldnames is None or not required_cols.issubset(set(reader.fieldnames)):
        raise HTTPException(
            status_code=400,
            detail=f"CSV must contain columns: {', '.join(sorted(required_cols))}",
        )

    rows = list(reader)
    if not rows:
        raise HTTPException(status_code=400, detail="CSV file is empty.")

    csv_emails = [r.get("email", "").strip() for r in rows]
    existing = get_existing_emails(db, client_id, csv_emails)

    skipped_emails: list[str] = []
    errors: list[str] = []
    seen_emails: set[str] = set()
    to_create: list[ConsumerCreate] = []

    for i, row in enumerate(rows, start=2):
        email = row.get("email", "").strip()

        if email in seen_emails:
            skipped_emails.append(email)
            continue
        seen_emails.add(email)

        if email in existing:
            skipped_emails.append(email)
            continue

        traits_raw = row.get("traits", "").strip()
        try:
            traits = json.loads(traits_raw) if traits_raw else {}
        except json.JSONDecodeError:
            errors.append(f"Row {i}: invalid JSON in traits for '{email}'")
            continue

        to_create.append(ConsumerCreate(
            email=email,
            phone=row.get("phone", "").strip(),
            first_name=row.get("first_name", "").strip(),
            last_name=row.get("last_name", "").strip(),
            traits=traits,
        ))

    created = 0
    if to_create:
        # Only touch SCRIPT_* / Grok when at least one row has non-empty traits; `{}` short-circuits
        # without any LLM client (matches generate_consumer_traits_description and avoids 500 in
        # environments without SCRIPT_API_KEY / SCRIPT_BASE_URL / SCRIPT_MODEL).
        descriptions: list[str] = []
        client_and_model: tuple | None = None
        script_llm_unavailable = False
        for item in to_create:
            traits = item.traits or {}
            if not traits:
                descriptions.append("")
                continue
            if script_llm_unavailable:
                descriptions.append("")
                continue
            if client_and_model is None:
                try:
                    client_and_model = get_script_llm_client_and_model()
                except Exception as exc:
                    logger.warning(
                        "SCRIPT_* unavailable or invalid for CSV consumer_traits_description (%s); "
                        "using empty descriptions for this row and any remaining rows with traits.",
                        exc,
                    )
                    script_llm_unavailable = True
                    descriptions.append("")
                    continue
            try:
                descriptions.append(
                    await generate_consumer_traits_description(
                        traits,
                        _client_and_model=client_and_model,
                    )
                )
            except Exception:
                logger.exception(
                    "traits_description LLM failed for email=%s; saving empty description",
                    item.email,
                )
                descriptions.append("")

        try:
            create_consumers_bulk(
                db, client_id, to_create, consumer_traits_descriptions=descriptions
            )
            created = len(to_create)
        except Exception as exc:
            db.rollback()
            errors.append(f"Batch insert failed: {exc}")

    return {
        "created": created,
        "skipped": len(skipped_emails),
        "skipped_emails": skipped_emails,
        "errors": errors,
    }


@router.post("/assign-personas", response_model=PersonaProcessingSummary)
async def assign_personas(
    body: AssignPersonasRequest,
    db: Session = Depends(get_db),
    client_id: int = Depends(get_current_client_id),
):
    """Assign personas to consumers using the LLM.

    - Pass consumer_ids to process specific consumers.
    - Omit consumer_ids (or pass null) to process all unassigned consumers for the client.
    - Already-assigned consumers are always skipped.
    """
    if body.consumer_ids is not None:
        owned = filter_owned_consumer_ids(db, client_id, body.consumer_ids)
        unauthorized = set(body.consumer_ids) - set(owned)
        if unauthorized:
            raise HTTPException(
                status_code=403,
                detail="One or more consumer IDs do not belong to this client.",
            )
        consumer_ids = body.consumer_ids
    else:
        consumer_ids = get_unassigned_consumer_ids(db, client_id)

    if not consumer_ids:
        return PersonaProcessingSummary(processed=0, failed=0, skipped=0, low_confidence=0, errors=[])

    try:
        openai_client = get_openai_client()
    except ValueError as exc:
        # Translate missing or invalid OpenAI configuration into a clear HTTP error
        raise HTTPException(status_code=500, detail=str(exc))

    result = await process_consumer_personas(db, consumer_ids, openai_client)
    return PersonaProcessingSummary(
        processed=result.processed,
        failed=result.failed,
        skipped=result.skipped,
        low_confidence=result.low_confidence,
        errors=result.errors,
    )


@router.post("/", response_model=ConsumerResponse, status_code=201)
async def create_new_consumer(
    data: ConsumerCreate,
    db: Session = Depends(get_db),
    client_id: int = Depends(get_current_client_id),
):
    """Create a new consumer for the authenticated client."""
    traits = data.traits or {}
    try:
        traits_description = await generate_consumer_traits_description(traits)
    except Exception:
        # Same resilience as CSV: missing SCRIPT_*, odd API responses (e.g. ValueError for no
        # choices), and other LLM failures should not block consumer creation.
        logger.exception(
            "traits_description LLM failed for new consumer email=%s; saving empty description",
            data.email,
        )
        traits_description = ""

    try:
        consumer = create_consumer(
            db,
            client_id,
            data,
            consumer_traits_description=traits_description,
        )
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail=f"A consumer with email '{data.email}' already exists.",
        )
    return _to_response(consumer)
