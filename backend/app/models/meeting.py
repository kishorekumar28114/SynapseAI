import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import func
import enum

from app.database.base import Base


class MeetingStatus(str, enum.Enum):
    UPLOADED = "uploaded"
    TRANSCRIBING = "transcribing"
    TRANSCRIBED = "transcribed"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class MeetingFileType(str, enum.Enum):
    AUDIO_MP3 = "mp3"
    AUDIO_WAV = "wav"
    AUDIO_M4A = "m4a"
    AUDIO_OGG = "ogg"
    DOC_PDF = "pdf"
    DOC_DOCX = "docx"
    DOC_TXT = "txt"


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    file_path = Column(String(500), nullable=False)
    # Use String to avoid SAEnum type mismatch with existing DB uppercase enum labels
    file_type = Column(String(50), nullable=False)
    file_size = Column(Integer, nullable=True)  # in bytes
    status = Column(String(50), nullable=False, default=MeetingStatus.UPLOADED.value)
    duration_seconds = Column(Integer, nullable=True)  # for audio files
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    meeting_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    team = relationship("Team", back_populates="meetings")
    project = relationship("Project", back_populates="meetings")
    uploaded_by_user = relationship("User", back_populates="uploaded_meetings")
    transcript = relationship(
        "Transcript", back_populates="meeting", uselist=False,
        cascade="all, delete-orphan", passive_deletes=True
    )
    tasks = relationship(
        "Task", back_populates="meeting",
        cascade="all, delete-orphan", passive_deletes=True
    )
    ai_analysis = relationship(
        "AIAnalysis", back_populates="meeting", uselist=False,
        cascade="all, delete-orphan", passive_deletes=True
    )

    def __repr__(self):
        return f"<Meeting {self.title} ({self.status})>"
