from fastapi import APIRouter, Depends, status
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
