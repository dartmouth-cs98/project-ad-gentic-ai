"""Symmetric token encryption shared across ad platform adapters.

Every platform persists an OAuth access token in ``SocialConnection.encrypted_token``
using the same Fernet key (``FERNET_SECRET_KEY``) so we can rotate the key in one
place if needed.
"""

import os

from cryptography.fernet import Fernet


def _fernet() -> Fernet:
    key = os.environ.get("FERNET_SECRET_KEY")
    if not key:
        raise RuntimeError("FERNET_SECRET_KEY env var not set")
    return Fernet(key.encode())


def encrypt_token(token: str) -> str:
    return _fernet().encrypt(token.encode()).decode()


def decrypt_token(encrypted: str) -> str:
    return _fernet().decrypt(encrypted.encode()).decode()
