"""Backoffice authentication helpers (SHA-256)."""

import hashlib


def hash_password(password: str) -> str:
    """Hash a password using SHA-256."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def verify_password(plain_password: str, password_hash: str) -> bool:
    """Verify a plaintext password against a SHA-256 hash."""
    return hash_password(plain_password) == password_hash
