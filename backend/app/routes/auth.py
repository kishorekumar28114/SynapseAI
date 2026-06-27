from fastapi import APIRouter, Depends, status, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.auth import (
    ManagerRegisterRequest,
    LoginRequest,
    GoogleAuthRequest,
    TokenResponse,
    UserOut,
)
from app.services.auth_service import AuthService
from app.auth.dependencies import get_current_active_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_manager(
    data: ManagerRegisterRequest,
    db: Session = Depends(get_db),
):
    """Register a new Manager account (email + password)."""
    user, token = AuthService.register_manager(data, db)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenResponse)
def login(
    data: LoginRequest,
    db: Session = Depends(get_db),
):
    """
    Login endpoint for all roles.
    - Manager: use email as identifier
    - Employee (Team Lead / Team Member): use username as identifier
    """
    user, token = AuthService.login(data, db)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/google", response_model=TokenResponse)
async def google_login(
    data: GoogleAuthRequest,
    db: Session = Depends(get_db),
):
    """Google OAuth login — creates or logs in a Manager account."""
    user, token = await AuthService.google_oauth_login(data, db)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_active_user)):
    """Return the currently authenticated user's profile."""
    return UserOut.model_validate(current_user)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class SetPasswordRequest(BaseModel):
    new_password: str


@router.post("/change-password", status_code=status.HTTP_200_OK)
def change_password(
    data: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Allow any authenticated user to change their own password."""
    from app.auth.hashing import verify_password, hash_password
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters.")
    current_user.password_hash = hash_password(data.new_password)
    db.commit()
    return {"message": "Password changed successfully."}

@router.post("/set-password", status_code=status.HTTP_200_OK)
def set_password(
    data: SetPasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Allow Google managers without a password to set one."""
    from app.auth.hashing import hash_password
    if current_user.password_hash is not None:
        raise HTTPException(status_code=400, detail="Account already has a password. Use change-password instead.")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters.")
    current_user.password_hash = hash_password(data.new_password)
    db.commit()
    return {"message": "Password set successfully."}
