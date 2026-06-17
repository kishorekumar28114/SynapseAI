import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean, Date
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import func
import enum

from app.database.base import Base


class TaskPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class Task(Base):
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    meeting_id = Column(UUID(as_uuid=True), ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    assignee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    # Use String to avoid SAEnum type mismatch with existing DB uppercase enum labels
    priority = Column(String(50), nullable=False, default=TaskPriority.MEDIUM.value)
    status = Column(String(50), nullable=False, default=TaskStatus.PENDING.value)
    deadline = Column(Date, nullable=True)
    extracted_deadline_text = Column(String(255), nullable=True)  # raw text from AI
    is_ai_extracted = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    meeting = relationship("Meeting", back_populates="tasks")
    assignee = relationship("User", foreign_keys=[assignee_id])

    def __repr__(self):
        return f"<Task {self.title[:40]} ({self.priority})>"
