import uuid
from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import func
import enum

from app.database.base import Base


class MemberRole(str, enum.Enum):
    TEAM_LEAD = "team_lead"
    TEAM_MEMBER = "team_member"


class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    # Store as String to avoid SQLAlchemy enum type mismatch with existing DB enum labels
    role_in_team = Column(String(50), nullable=False, default=MemberRole.TEAM_MEMBER.value)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    team = relationship("Team", back_populates="members")
    user = relationship("User", back_populates="team_memberships")

    def __repr__(self):
        return f"<TeamMember team={self.team_id} user={self.user_id}>"
