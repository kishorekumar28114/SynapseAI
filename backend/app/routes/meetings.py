from fastapi import APIRouter, Depends, status, UploadFile, File, Form, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
import os

from app.database.session import get_db
from app.auth.dependencies import require_team_lead, get_current_active_user, require_manager
from app.schemas.meeting import MeetingCreate, MeetingWithAnalysis
from app.services.meeting_service import MeetingService
from app.models.user import User, UserRole
from app.models.meeting import Meeting
from app.models.team_member import TeamMember

router = APIRouter(prefix="/meetings", tags=["Meetings"])


@router.post("", response_model=MeetingWithAnalysis, status_code=status.HTTP_201_CREATED)
async def upload_meeting(
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    team_id: UUID = Form(...),
    description: Optional[str] = Form(None),
    project_id: Optional[UUID] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_team_lead),
):
    """Upload a meeting file (audio or document). Team Lead only."""
    data = MeetingCreate(
        title=title,
        description=description,
        team_id=team_id,
        project_id=project_id,
    )
    meeting = await MeetingService.upload_meeting(data, file, current_user.id, db)
    return MeetingService.build_meeting_with_analysis(meeting)


@router.get("/my", response_model=List[MeetingWithAnalysis])
def my_meetings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List all meetings for the current user's teams."""
    meetings = MeetingService.get_meetings_for_user(current_user.id, db)
    return [MeetingService.build_meeting_with_analysis(m) for m in meetings]


@router.get("/all", response_model=List[MeetingWithAnalysis])
def all_meetings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Manager: all meetings across all their teams. Others: same as /my."""
    if current_user.role == UserRole.MANAGER:
        from app.models.team import Team
        teams = db.query(Team).filter(
            Team.manager_id == current_user.id,
            Team.is_active == True
        ).all()
        team_ids = [t.id for t in teams]
        meetings = (
            db.query(Meeting)
            .filter(Meeting.team_id.in_(team_ids))
            .order_by(Meeting.created_at.desc())
            .all()
        )
    else:
        meetings = MeetingService.get_meetings_for_user(current_user.id, db)
    return [MeetingService.build_meeting_with_analysis(m) for m in meetings]


@router.get("/team/{team_id}", response_model=List[MeetingWithAnalysis])
def team_meetings(
    team_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    meetings = MeetingService.get_meetings_for_team(team_id, db)
    return [MeetingService.build_meeting_with_analysis(m) for m in meetings]


@router.get("/{meeting_id}", response_model=MeetingWithAnalysis)
def get_meeting(
    meeting_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    meeting = MeetingService.get_meeting(meeting_id, db)
    return MeetingService.build_meeting_with_analysis(meeting)


@router.delete("/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meeting(
    meeting_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete a meeting. Manager can delete any; team_lead can delete their own uploads."""
    meeting = MeetingService.get_meeting(meeting_id, db)

    is_manager = current_user.role == UserRole.MANAGER
    is_uploader = str(meeting.uploaded_by) == str(current_user.id)

    if not is_manager and not is_uploader:
        raise HTTPException(status_code=403, detail="Not authorized to delete this meeting.")

    # Explicitly delete child records first to avoid FK constraint violations
    # (belt-and-suspenders alongside the ORM cascade on the model)
    from app.models.task import Task
    from app.models.transcript import Transcript
    from app.models.ai_analysis import AIAnalysis

    db.query(Task).filter(Task.meeting_id == meeting_id).delete(synchronize_session=False)
    db.query(AIAnalysis).filter(AIAnalysis.meeting_id == meeting_id).delete(synchronize_session=False)
    db.query(Transcript).filter(Transcript.meeting_id == meeting_id).delete(synchronize_session=False)
    db.flush()

    # Remove physical file
    if meeting.file_path and os.path.exists(meeting.file_path):
        try:
            os.remove(meeting.file_path)
        except Exception:
            pass

    db.delete(meeting)
    db.commit()
