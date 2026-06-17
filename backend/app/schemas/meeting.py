from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from app.models.meeting import MeetingStatus, MeetingFileType


class MeetingCreate(BaseModel):
    title: str
    description: Optional[str] = None
    team_id: UUID
    project_id: Optional[UUID] = None
    meeting_date: Optional[datetime] = None


class MeetingOut(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    file_path: str
    file_type: MeetingFileType
    file_size: Optional[int]
    status: MeetingStatus
    duration_seconds: Optional[int]
    team_id: UUID
    project_id: Optional[UUID]
    uploaded_by: UUID
    meeting_date: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class MeetingWithAnalysis(MeetingOut):
    has_transcript: bool = False
    has_analysis: bool = False
    efficiency_score: Optional[float] = None
    summary_preview: Optional[str] = None
