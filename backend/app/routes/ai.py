from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional
import re

from app.database.session import get_db
from app.auth.dependencies import require_team_lead, get_current_active_user
from app.models.user import User, UserRole
from app.models.meeting import Meeting, MeetingStatus
from app.ai.processor import process_meeting
from app.ai.retrieval import ManagerRetrievalService, EmployeeRetrievalService
from app.ai.ollama_client import ollama_client
from app.ai.prompts import MANAGER_CHAT_PROMPT, EMPLOYEE_CHAT_PROMPT

router = APIRouter(prefix="/ai", tags=["AI"])


@router.post("/process/{meeting_id}")
async def trigger_ai_processing(
    meeting_id: UUID,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_team_lead),
):
    """Trigger AI processing for an uploaded meeting. Team Lead only."""
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found.")
    if meeting.status == MeetingStatus.PROCESSING:
        raise HTTPException(status_code=409, detail="Meeting is already being processed.")
    if meeting.status == MeetingStatus.COMPLETED:
        raise HTTPException(status_code=409, detail="Meeting has already been processed.")

    background_tasks.add_task(process_meeting, meeting.id, db)

    return {
        "message": "AI processing started.",
        "meeting_id": str(meeting_id),
        "status": "processing",
    }


@router.get("/status/{meeting_id}")
def get_processing_status(
    meeting_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Check the AI processing status of a meeting."""
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found.")
    return {
        "meeting_id": str(meeting_id),
        "status": meeting.status,
        "has_analysis": meeting.ai_analysis is not None,
    }


@router.get("/health")
async def ollama_health():
    """Check if Ollama is running and accessible."""
    is_healthy = await ollama_client.health_check()
    return {
        "ollama_status": "running" if is_healthy else "unreachable",
        "model": ollama_client.model,
        "base_url": ollama_client.base_url,
    }


# ── Chat ──────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    question: str
    # Manager: must supply project_id; team_id optional
    # Employee: must supply team_id; project_id optional
    project_id: Optional[UUID] = None
    team_id: Optional[UUID] = None


class ChatResponse(BaseModel):
    answer: str
    sources: list = []


@router.post("/chat", response_model=ChatResponse)
async def ai_chat(
    data: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Role-aware AI chat endpoint.
    - Manager: needs project_id → gets cross-team strategic view.
    - Employee/Team Lead: needs team_id → gets personal + team view.
    """
    is_manager = current_user.role == UserRole.MANAGER

    if is_manager:
        if not data.project_id:
            raise HTTPException(
                status_code=400,
                detail="Managers must supply a project_id to chat."
            )
        ctx = ManagerRetrievalService.build_context(data.project_id, db)
        prompt = MANAGER_CHAT_PROMPT.format(
            project=ctx["project"],
            teams=ctx["teams"],
            meetings_efficiency=ctx["meetings_efficiency"],
            tasks_summary=ctx["tasks_summary"],
            question=data.question,
        )
    else:
        if not data.team_id:
            raise HTTPException(
                status_code=400,
                detail="Team members must supply a team_id to chat."
            )
        ctx = EmployeeRetrievalService.build_context(data.team_id, current_user.id, db)
        prompt = EMPLOYEE_CHAT_PROMPT.format(
            project=ctx["project"],
            meetings=ctx["meetings"],
            my_tasks=ctx["my_tasks"],
            team_tasks=ctx["team_tasks"],
            question=data.question,
        )

    answer = await ollama_client.generate(prompt)

    # Strip thinking tags if model emits them
    answer = re.sub(r'<think>.*?</think>', '', answer, flags=re.DOTALL).strip()

    return ChatResponse(answer=answer)
