"""Admin access helpers for user/admin or backoffice credentials."""

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.backoffice_user import BackofficeUser


def require_admin_access(
    db: Session,
    user_id: int | None,
    backoffice_user: BackofficeUser | None,
) -> None:
    if backoffice_user:
        return

    if user_id is None:
        raise HTTPException(status_code=401, detail="Credenciales requeridas")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Solo administradores pueden acceder")
