import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import func

from app.database.base import Base


class Team(Base):
    __tablename__ = "teams"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    manager_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Optional link to a project — manager assigns a project to this team
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True)

    # Relationships
    manager = relationship("User", back_populates="managed_teams", foreign_keys=[manager_id])
    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="team", foreign_keys="Project.team_id")
    assigned_project = relationship("Project", foreign_keys=[project_id], post_update=True)
    meetings = relationship("Meeting", back_populates="team")

    def __repr__(self):
        return f"<Team {self.name}>"
