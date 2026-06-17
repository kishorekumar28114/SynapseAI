from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from uuid import UUID
from app.models.user import UserRole


# ─── Register ────────────────────────────────────────────────────────────────

class ManagerRegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    username: str
    password: str

    @field_validator("username")
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        v = v.strip().lower()
        if not v.replace("_", "").replace("-", "").isalnum():
            raise ValueError("Username must contain only letters, numbers, underscores, or hyphens")
        if len(v) < 3:
            raise ValueError("Username must be at least 3 characters")
        return v

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


# ─── Login ────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    """Used for both manager (email) and employee (username) login."""
    identifier: str  # email or username
    password: str


class GoogleAuthRequest(BaseModel):
    credential: Optional[str] = None    # Google ID token (from One Tap)
    access_token: Optional[str] = None  # Google Access token (from OAuth popup)


# ─── Responses ───────────────────────────────────────────────────────────────

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserOut(BaseModel):
    id: UUID
    email: Optional[str]
    username: str
    full_name: str
    role: UserRole
    avatar_url: Optional[str] = None
    is_active: bool

    model_config = {"from_attributes": True}


# Update forward reference
TokenResponse.model_rebuild()
