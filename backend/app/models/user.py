import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import func
import enum

from app.database.base import Base


class UserRole(str, enum.Enum):
    MANAGER = "manager"
    TEAM_LEAD = "team_lead"
    TEAM_MEMBER = "team_member"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=True)  # nullable for Google OAuth
    # Use String to avoid SAEnum type mismatch with existing DB uppercase enum labels (MANAGER, TEAM_LEAD, TEAM_MEMBER)
    role = Column(String(50), nullable=False, default=UserRole.TEAM_MEMBER.value)
    is_active = Column(Boolean, default=True, nullable=False)
    google_id = Column(String(255), unique=True, nullable=True)
    avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    managed_teams = relationship("Team", back_populates="manager", foreign_keys="Team.manager_id")
    team_memberships = relationship("TeamMember", back_populates="user")
    uploaded_meetings = relationship("Meeting", back_populates="uploaded_by_user")

    def __repr__(self):
        return f"<User {self.username} ({self.role})>"
