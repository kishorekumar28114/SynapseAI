import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Float, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy import func

from app.database.base import Base


class AIAnalysis(Base):
    __tablename__ = "ai_analysis"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    meeting_id = Column(UUID(as_uuid=True), ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, unique=True)

    # Summary
    summary = Column(Text, nullable=True)
    key_points = Column(JSONB, nullable=True)  # list of strings

    # Sentiment
    overall_sentiment = Column(String(50), nullable=True)  # positive/negative/neutral
    sentiment_score = Column(Float, nullable=True)  # -1.0 to 1.0

    # Productivity Metrics
    meeting_efficiency_score = Column(Float, nullable=True)  # 0-100
    productive_discussion_pct = Column(Float, nullable=True)
    off_topic_discussion_pct = Column(Float, nullable=True)
    action_items_count = Column(Integer, nullable=True)

    # Participation
    participation_insights = Column(JSONB, nullable=True)
    # Example: [{"name": "Alice", "contribution_pct": 35, "sentiment": "positive"}]

    # Raw AI outputs (for debugging/reprocessing)
    raw_summary_response = Column(JSONB, nullable=True)
    raw_tasks_response = Column(JSONB, nullable=True)
    raw_sentiment_response = Column(JSONB, nullable=True)
    raw_metrics_response = Column(JSONB, nullable=True)

    processing_time_seconds = Column(Float, nullable=True)
    model_used = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    meeting = relationship("Meeting", back_populates="ai_analysis")

    def __repr__(self):
        return f"<AIAnalysis meeting={self.meeting_id} score={self.meeting_efficiency_score}>"
