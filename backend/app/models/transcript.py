import uuid
from sqlalchemy import Column, DateTime, ForeignKey, Text, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import func

from app.database.base import Base


class Transcript(Base):
    __tablename__ = "transcripts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    meeting_id = Column(UUID(as_uuid=True), ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, unique=True)
    raw_text = Column(Text, nullable=False)
    word_count = Column(Integer, nullable=True)
    language = Column(Text, nullable=True, default="en")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    meeting = relationship("Meeting", back_populates="transcript")

    def __repr__(self):
        return f"<Transcript meeting={self.meeting_id}>"
