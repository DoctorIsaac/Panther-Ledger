import os
from cryptography.fernet import Fernet


def _get_fernet() -> Fernet:
    key = os.environ.get("FIELD_ENCRYPTION_KEY")
    if not key:
        raise RuntimeError("FIELD_ENCRYPTION_KEY is not set in environment variables")
    return Fernet(key.encode())


def encrypt_field(value: str) -> str:
    """Encrypt a string field before storing in the database."""
    if not value:
        return value
    return _get_fernet().encrypt(value.encode()).decode()


def decrypt_field(value: str) -> str:
    """Decrypt a string field retrieved from the database.
    Falls back to returning the raw value if decryption fails
    (handles pre-encryption data already in the database).
    """
    if not value:
        return value
    try:
        return _get_fernet().decrypt(value.encode()).decode()
    except Exception:
        return value
