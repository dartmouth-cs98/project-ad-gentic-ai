"""API routes for personas."""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_client_id
from models.persona import Persona
from schemas.persona import PersonaResponse

router = APIRouter()


@router.get("/", response_model=list[PersonaResponse])
def list_personas(
    db: Session = Depends(get_db),
    _client_id: int = Depends(get_current_client_id),
):
    """Return all available personas. Requires a valid JWT token."""
    personas = list(db.scalars(select(Persona).order_by(Persona.name)).all())
    return personas
