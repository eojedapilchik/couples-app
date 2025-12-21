"""User schemas - Request/Response DTOs."""

from datetime import datetime
from pydantic import BaseModel, Field


class UserBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class UserCreate(UserBase):
    pin: str = Field(..., min_length=4, max_length=10)


class UserResponse(UserBase):
    id: int
    is_admin: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}


class LoginRequest(BaseModel):
    user_id: int
    pin: str = Field(..., min_length=4, max_length=10)


class LoginResponse(BaseModel):
    user: UserResponse
    message: str = "Login exitoso"
