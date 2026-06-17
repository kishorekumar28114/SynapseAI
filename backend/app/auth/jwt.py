from datetime import datetime, timedelta, timezone
from typing import Optional, Any
import jwt as pyjwt

from app.config import settings


def create_access_token(subject: str, role: str, extra_data: Optional[dict] = None) -> str:
    """
    Create a signed JWT access token.
    subject: typically the user's UUID as string
    role: the user's role string
    """
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload: dict[str, Any] = {
        "sub": subject,
        "role": role,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    if extra_data:
        payload.update(extra_data)

    token = pyjwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return token


def decode_token(token: str) -> dict:
    """
    Decode and validate a JWT token.
    Raises jwt.PyJWTError on invalid/expired tokens.
    """
    payload = pyjwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
    )
    return payload
