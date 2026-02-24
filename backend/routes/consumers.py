"""API routes for consumers — POST, GET all, and CSV upload."""

import csv
import io
import json

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from schemas.consumer import ConsumerCreate, ConsumerResponse, ConsumerCsvUploadResponse
from crud.consumer import get_consumers, create_consumer, create_consumers_bulk, get_existing_emails
from dependencies import get_current_client_id

router = APIRouter()


def _to_response(consumer) -> dict:
    """Convert a Consumer ORM instance to a response-friendly dict,
    deserializing the traits JSON string back to a dict."""
    data = {
        "id": consumer.id,
        "email": consumer.email,
        "phone": consumer.phone,
        "first_name": consumer.first_name,
        "last_name": consumer.last_name,
        "traits": json.loads(consumer.traits) if consumer.traits else None,
        "created_at": consumer.created_at,
        "updated_at": consumer.updated_at,
    }
    return data


@router.get("/", response_model=list[ConsumerResponse])
def list_consumers(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    client_id: int = Depends(get_current_client_id),
):
    """Get all consumers for the authenticated client."""
    consumers = get_consumers(db, client_id=client_id, skip=skip, limit=limit)
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

    # Collect all emails from the CSV
    csv_emails = [r.get("email", "").strip() for r in rows]

    # Check which emails already exist in the DB for this client
    existing = get_existing_emails(db, client_id, csv_emails)

    skipped_emails: list[str] = []
    errors: list[str] = []
    seen_emails: set[str] = set()
    to_create: list[ConsumerCreate] = []

    for i, row in enumerate(rows, start=2):  # start=2 because row 1 is the header
        email = row.get("email", "").strip()

        # Skip duplicates within the CSV itself
        if email in seen_emails:
            skipped_emails.append(email)
            continue
        seen_emails.add(email)

        # Skip emails that already exist in the DB for this client
        if email in existing:
            skipped_emails.append(email)
            continue

        # Parse traits JSON
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

    # Batch-insert all valid rows in a single transaction
    created = 0
    if to_create:
        try:
            create_consumers_bulk(db, client_id, to_create)
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


@router.post("/", response_model=ConsumerResponse, status_code=201)
def create_new_consumer(
    data: ConsumerCreate,
    db: Session = Depends(get_db),
    client_id: int = Depends(get_current_client_id),
):
    """Create a new consumer for the authenticated client."""
    try:
        consumer = create_consumer(db, client_id, data)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail=f"A consumer with email '{data.email}' already exists.",
        )
    return _to_response(consumer)
