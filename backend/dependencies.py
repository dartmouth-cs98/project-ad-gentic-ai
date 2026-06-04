import os
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_DAYS = 7

_bearer = HTTPBearer()

def get_current_client_id(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> int:
    if not JWT_SECRET:
        raise RuntimeError("JWT_SECRET environment variable must be set for JWT signing.")
    try:
        payload = jwt.decode(
            credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM]
        )
        return int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
        )

def create_access_token(client_id: int, email: str) -> str:
    if not JWT_SECRET:
        raise RuntimeError("JWT_SECRET environment variable must be set for JWT signing.")
    expire = datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRY_DAYS)
    payload = {"sub": str(client_id), "email": email, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
