import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Numeric, Date, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy import func

from app.database.base import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    client_requirements = Column(Text, nullable=True)
    requirements_file_path = Column(String(500), nullable=True)

    # These are now set via team assignment, not at project creation
    deadline = Column(Date, nullable=True)
    budget = Column(Numeric(12, 2), nullable=True)

    # team_id is now nullable — project is created standalone, then assigned via team
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id"), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # AI Analysis fields (populated after requirements file analysis)
    ai_difficulty = Column(String(50), nullable=True)          # e.g. "medium", "high"
    ai_teams_needed = Column(Integer, nullable=True)            # e.g. 2
    ai_budget_estimate = Column(Text, nullable=True)            # e.g. "$50,000 – $80,000"
    ai_time_estimate = Column(Text, nullable=True)              # e.g. "3–4 months"
    ai_analysis_summary = Column(Text, nullable=True)           # free-text summary
    ai_analysis_status = Column(String(30), nullable=True, default="pending")  # pending/done/failed

    # Relationships
    team = relationship("Team", back_populates="projects", foreign_keys=[team_id])
    creator = relationship("User", foreign_keys=[created_by])
    meetings = relationship("Meeting", back_populates="project")

    def __repr__(self):
        return f"<Project {self.name}>"
