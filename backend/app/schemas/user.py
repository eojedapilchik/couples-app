"""User schemas - Request/Response DTOs."""

from datetime import datetime
from pydantic import BaseModel, Field


class UserBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    nickname: str | None = Field(None, max_length=50)


class UserCreate(UserBase):
    pin: str = Field(..., min_length=4, max_length=10)


class PartnerInfo(BaseModel):
    """Minimal partner info to avoid circular references."""
    id: int
    name: str
    nickname: str | None = None

    model_config = {"from_attributes": True}


class UserResponse(UserBase):
    id: int
    is_admin: bool = False
    partner_id: int | None = None
    partner: PartnerInfo | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    """Schema for updating user profile."""
    name: str | None = Field(None, min_length=1, max_length=100)
    nickname: str | None = Field(None, max_length=50)
    partner_id: int | None = None


class LoginRequest(BaseModel):
    user_id: int
    pin: str = Field(..., min_length=4, max_length=10)


class LoginResponse(BaseModel):
    user: UserResponse
    message: str = "Login exitoso"
