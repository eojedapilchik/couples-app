"""Dependencies for backoffice authentication."""

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.backoffice_user import BackofficeUser
from app.backoffice_auth import verify_password

backoffice_security = HTTPBasic(auto_error=False)


def get_backoffice_user_optional(
    credentials: HTTPBasicCredentials | None = Depends(backoffice_security),
    db: Session = Depends(get_db),
) -> BackofficeUser | None:
    if not credentials:
        return None

    user = db.query(BackofficeUser).filter(
        BackofficeUser.username == credentials.username
    ).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales invalidas")

    return user
