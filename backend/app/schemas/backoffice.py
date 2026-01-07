"""Backoffice auth schemas."""

from pydantic import BaseModel


class BackofficeLoginRequest(BaseModel):
    username: str
    password: str


class BackofficeLoginResponse(BaseModel):
    username: str
    message: str
