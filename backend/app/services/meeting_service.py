import os
import shutil
from pathlib import Path
from typing import List
from uuid import UUID
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.models.meeting import Meeting, MeetingFileType, MeetingStatus
from app.schemas.meeting import MeetingCreate, MeetingWithAnalysis
from app.config import settings

# All allowed extensions
ALLOWED_AUDIO = {"mp3", "wav", "m4a", "ogg", "flac"}
ALLOWED_DOCS = {"pdf", "docx", "txt"}
ALLOWED_ALL = ALLOWED_AUDIO | ALLOWED_DOCS
MAX_SIZE_BYTES = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024


def _get_file_type(extension: str) -> MeetingFileType:
    mapping = {
        "mp3": MeetingFileType.AUDIO_MP3,
        "wav": MeetingFileType.AUDIO_WAV,
        "m4a": MeetingFileType.AUDIO_M4A,
        "ogg": MeetingFileType.AUDIO_OGG,
        "flac": MeetingFileType.AUDIO_OGG,  # Map flac to ogg type (generic audio)
        "pdf": MeetingFileType.DOC_PDF,
        "docx": MeetingFileType.DOC_DOCX,
        "txt": MeetingFileType.DOC_TXT,
    }
    return mapping[extension]


class MeetingService:

    @staticmethod
    async def upload_meeting(
        data: MeetingCreate,
        file: UploadFile,
        uploaded_by: UUID,
        db: Session,
    ) -> Meeting:
        # Validate extension
        filename = file.filename or ""
        extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if extension not in ALLOWED_ALL:
            raise HTTPException(
                status_code=400,
                detail=f"File type '.{extension}' not allowed. Allowed: {', '.join(sorted(ALLOWED_ALL))}",
            )

        # Save file
        upload_dir = Path(settings.UPLOAD_DIR) / "meetings"
        upload_dir.mkdir(parents=True, exist_ok=True)

        # Read into memory to check size
        content = await file.read()
        if len(content) > MAX_SIZE_BYTES:
            raise HTTPException(
                status_code=413,
                detail=f"File exceeds max size of {settings.MAX_UPLOAD_SIZE_MB}MB.",
            )

        import uuid as uuid_module
        unique_name = f"{uuid_module.uuid4()}.{extension}"
        file_path = upload_dir / unique_name

        with open(file_path, "wb") as f:
            f.write(content)

        meeting = Meeting(
            title=data.title,
            description=data.description,
            file_path=str(file_path),
            file_type=_get_file_type(extension),
            file_size=len(content),
            status=MeetingStatus.UPLOADED,
            team_id=data.team_id,
            project_id=data.project_id,
            uploaded_by=uploaded_by,
            meeting_date=data.meeting_date,
        )
        db.add(meeting)
        db.commit()
        db.refresh(meeting)
        return meeting

    @staticmethod
    def get_meeting(meeting_id: UUID, db: Session) -> Meeting:
        meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
        if not meeting:
            raise HTTPException(status_code=404, detail="Meeting not found.")
        return meeting

    @staticmethod
    def get_meetings_for_team(team_id: UUID, db: Session) -> List[Meeting]:
        return (
            db.query(Meeting)
            .filter(Meeting.team_id == team_id)
            .order_by(Meeting.created_at.desc())
            .all()
        )

    @staticmethod
    def get_meetings_for_user(user_id: UUID, db: Session) -> List[Meeting]:
        from app.models.team_member import TeamMember
        team_ids = [tm.team_id for tm in db.query(TeamMember).filter(TeamMember.user_id == user_id).all()]
        return (
            db.query(Meeting)
            .filter(Meeting.team_id.in_(team_ids))
            .order_by(Meeting.created_at.desc())
            .all()
        )

    @staticmethod
    def build_meeting_with_analysis(meeting: Meeting) -> MeetingWithAnalysis:
        analysis = meeting.ai_analysis
        return MeetingWithAnalysis(
            **{
                col: getattr(meeting, col)
                for col in [
                    "id", "title", "description", "file_path", "file_type",
                    "file_size", "status", "duration_seconds", "team_id",
                    "project_id", "uploaded_by", "meeting_date", "created_at",
                ]
            },
            has_transcript=meeting.transcript is not None,
            has_analysis=analysis is not None,
            efficiency_score=analysis.meeting_efficiency_score if analysis else None,
            summary_preview=(analysis.summary[:200] + "...") if analysis and analysis.summary else None,
        )
