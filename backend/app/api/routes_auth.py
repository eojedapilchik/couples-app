"""Auth routes - Login endpoint."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user import LoginRequest, LoginResponse, UserResponse
from app.auth import verify_pin

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login with user ID and PIN."""
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if not verify_pin(request.pin, user.pin_hash):
        raise HTTPException(status_code=401, detail="PIN incorrecto")

    return LoginResponse(
        user=UserResponse.model_validate(user),
        message="Login exitoso",
    )


@router.get("/users", response_model=list[UserResponse])
def get_users(db: Session = Depends(get_db)):
    """Get all users (for login selection)."""
    users = db.query(User).all()
    return [UserResponse.model_validate(u) for u in users]
