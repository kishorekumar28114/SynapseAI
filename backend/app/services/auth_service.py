from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import httpx

from app.models.user import User, UserRole
from app.schemas.auth import ManagerRegisterRequest, LoginRequest, GoogleAuthRequest
from app.auth.hashing import hash_password, verify_password
from app.auth.jwt import create_access_token
from app.config import settings


class AuthService:
    """Business logic for authentication."""

    @staticmethod
    def register_manager(data: ManagerRegisterRequest, db: Session) -> tuple[User, str]:
        """Register a new manager account."""
        # Check email uniqueness
        if db.query(User).filter(User.email == data.email).first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists.",
            )
        # Check username uniqueness
        if db.query(User).filter(User.username == data.username).first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This username is already taken.",
            )

        user = User(
            email=data.email,
            username=data.username,
            full_name=data.full_name,
            password_hash=hash_password(data.password),
            role=UserRole.MANAGER,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        token = create_access_token(str(user.id), str(user.role))
        return user, token

    @staticmethod
    def login(data: LoginRequest, db: Session) -> tuple[User, str]:
        """
        Authenticate a user by email or username.
        Managers can use email; employees use username.
        """
        identifier = data.identifier.strip()

        # Try email first, then username
        user: Optional[User] = None
        if "@" in identifier:
            user = db.query(User).filter(User.email == identifier).first()
        else:
            user = db.query(User).filter(User.username == identifier).first()

        if not user or not user.password_hash:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials.",
            )

        if not verify_password(data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials.",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is deactivated. Contact your manager.",
            )

        token = create_access_token(str(user.id), str(user.role))
        return user, token

    @staticmethod
    async def google_oauth_login(data: GoogleAuthRequest, db: Session) -> tuple[User, str]:
        """
        Verify Google token and create/login the manager.
        Supports two flows:
        - credential (id_token): from Google One Tap — verify via tokeninfo
        - access_token: from OAuth popup — fetch user via userinfo endpoint
        """
        google_data: dict = {}

        async with httpx.AsyncClient(timeout=10.0) as client:
            if data.access_token:
                # OAuth popup flow — use access token to get user info
                response = await client.get(
                    "https://www.googleapis.com/oauth2/v3/userinfo",
                    headers={"Authorization": f"Bearer {data.access_token}"},
                )
                if response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid Google access token.",
                    )
                google_data = response.json()

            elif data.credential:
                # One Tap flow — verify id_token via tokeninfo
                response = await client.get(
                    "https://oauth2.googleapis.com/tokeninfo",
                    params={"id_token": data.credential},
                )
                if response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid Google ID token.",
                    )
                google_data = response.json()
                # Validate audience
                if settings.GOOGLE_CLIENT_ID and google_data.get("aud") != settings.GOOGLE_CLIENT_ID:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Token audience mismatch.",
                    )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Must provide either credential (id_token) or access_token.",
                )

        google_id = google_data.get("sub")
        email = google_data.get("email")
        full_name = google_data.get("name", email)
        avatar_url = google_data.get("picture")

        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google account must have a verified email address.",
            )

        user = db.query(User).filter(
            (User.google_id == google_id) | (User.email == email)
        ).first()

        if user:
            # Update google_id if not set
            if not user.google_id:
                user.google_id = google_id
            if avatar_url and not user.avatar_url:
                user.avatar_url = avatar_url
            db.commit()
        else:
            # Auto-generate username from email
            base_username = email.split("@")[0].lower().replace(".", "_")
            username = base_username
            counter = 1
            while db.query(User).filter(User.username == username).first():
                username = f"{base_username}{counter}"
                counter += 1

            user = User(
                email=email,
                username=username,
                full_name=full_name,
                google_id=google_id,
                avatar_url=avatar_url,
                role=UserRole.MANAGER,
                is_active=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        if not user.is_active:
            raise HTTPException(status_code=403, detail="Account deactivated.")

        token = create_access_token(str(user.id), str(user.role))
        return user, token
