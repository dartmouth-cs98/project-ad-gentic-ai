"""API routes for consumers — POST, GET all, CSV upload, and persona assignment."""

import asyncio
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

# ── Flexible CSV column resolution ───────────────────────────────────────────
_ALIASES: dict[str, list[str]] = {
    "email": ["email", "email_address", "emailaddress", "e_mail", "user_email", "customer_email"],
    "first_name": ["first_name", "firstname", "first", "given_name", "fname", "forename", "name"],
    "last_name": ["last_name", "lastname", "last", "surname", "family_name", "lname"],
    "phone": ["phone", "phone_number", "phonenumber", "mobile", "cell", "telephone", "tel"],
    "traits": ["traits", "attributes", "custom_fields", "metadata", "extra", "properties"],
}
_IDENTIFIER_COLUMNS = {"email", "phone"}


def _normalise_header(h: str) -> str:
    return h.strip().lower().replace(" ", "_").replace("-", "_").replace(".", "_")


def _resolve_columns(fieldnames: list[str]) -> dict[str, str]:
    """Return {canonical_name: actual_column_header} for every recognised field."""
    normed = {_normalise_header(f): f for f in fieldnames}
    resolved: dict[str, str] = {}
    for canonical, aliases in _ALIASES.items():
        for alias in aliases:
            if alias in normed:
                resolved[canonical] = normed[alias]
                break
    return resolved


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

    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="CSV file is empty or has no headers.")

    col = _resolve_columns(list(reader.fieldnames))

    if not _IDENTIFIER_COLUMNS.intersection(col.keys()):
        raise HTTPException(
            status_code=400,
            detail=(
                "CSV must include at least one identifier column: "
                "email or phone."
            ),
        )

    rows = list(reader)
    if not rows:
        raise HTTPException(
            status_code=400,
            detail="CSV file is empty: it has headers but no data rows.",
        )

    mapped_cols = set(col.values())
    csv_emails = (
        [r.get(col["email"], "").strip() for r in rows if r.get(col["email"], "").strip()]
        if "email" in col
        else []
    )
    existing = get_existing_emails(db, client_id, csv_emails) if csv_emails else set()

    skipped_emails: list[str] = []
    errors: list[str] = []
    seen_emails: set[str] = set()
    to_create: list[ConsumerCreate] = []

    for i, row in enumerate(rows, start=2):
        email = row.get(col["email"], "").strip() if "email" in col else ""
        phone = row.get(col["phone"], "").strip() if "phone" in col else ""

        if not email and not phone:
            errors.append(f"Row {i}: missing email and phone, skipped.")
            continue

        if email and email in seen_emails:
            skipped_emails.append(email)
            continue
        if email:
            seen_emails.add(email)

        if email and email in existing:
            skipped_emails.append(email)
            continue

        first_name = row.get(col["first_name"], "").strip() if "first_name" in col else ""
        last_name = row.get(col["last_name"],  "").strip() if "last_name" in col else ""

        if "traits" in col:
            traits_raw = row.get(col["traits"], "").strip()
            try:
                traits: dict = json.loads(traits_raw) if traits_raw else {}
            except json.JSONDecodeError:
                errors.append(f"Row {i}: invalid JSON in traits for '{email}', skipped.")
                continue
        else:
            # No explicit traits column — collect every unmapped column as flat key/value traits.
            traits = {k: v.strip() for k, v in row.items() if k not in mapped_cols and v.strip()}

        to_create.append(ConsumerCreate(
            email=email,
            phone=phone,
            first_name=first_name,
            last_name=last_name,
            traits=traits,
        ))

    created = 0
    if to_create:
        # Initialise the LLM client once; all per-row calls run concurrently via gather.
        client_and_model: tuple | None = None
        try:
            client_and_model = get_script_llm_client_and_model()
        except Exception as exc:
            logger.warning(
                "SCRIPT_* unavailable for CSV consumer_traits_description (%s); "
                "all descriptions will be empty.",
                exc,
            )

        async def _describe(item: ConsumerCreate) -> str:
            traits = item.traits or {}
            if not traits or client_and_model is None:
                return ""
            try:
                return await generate_consumer_traits_description(
                    traits, _client_and_model=client_and_model
                )
            except Exception:
                logger.exception(
                    "traits_description LLM failed for email=%s; saving empty description",
                    item.email,
                )
                return ""

        descriptions: list[str] = await asyncio.gather(*[_describe(item) for item in to_create])

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
