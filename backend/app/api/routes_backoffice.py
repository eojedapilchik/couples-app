"""Backoffice auth routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.backoffice_auth import verify_password
from app.database import get_db
from app.models.backoffice_user import BackofficeUser
from app.schemas.backoffice import BackofficeLoginRequest, BackofficeLoginResponse

router = APIRouter()


@router.post("/login", response_model=BackofficeLoginResponse)
def login_backoffice(
    request: BackofficeLoginRequest,
    db: Session = Depends(get_db),
) -> BackofficeLoginResponse:
    """Login for backoffice users."""
    user = db.query(BackofficeUser).filter(
        BackofficeUser.username == request.username
    ).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales invalidas")

    return BackofficeLoginResponse(
        username=user.username,
        message="Login exitoso",
    )
