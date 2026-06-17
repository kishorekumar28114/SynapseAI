from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional

from app.database.session import get_db
from app.auth.dependencies import require_team_lead, get_current_active_user
from app.models.user import User
from app.models.meeting import Meeting, MeetingStatus
from app.ai.processor import process_meeting
from app.ai.retrieval import RetrievalService
from app.ai.ollama_client import ollama_client
from app.ai.prompts import AI_CHAT_PROMPT

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

    # Run processing in background
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


# ── Chat ─────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    question: str
    team_id: UUID


class ChatResponse(BaseModel):
    answer: str
    sources: list = []


@router.post("/chat", response_model=ChatResponse)
async def ai_chat(
    data: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """AI Assistant chat endpoint with DB context retrieval."""
    # Build context
    project_context = RetrievalService.get_project_context(data.team_id, db)
    meetings_context = RetrievalService.get_recent_meetings_context(data.team_id, db)
    tasks_context = RetrievalService.get_tasks_context(data.team_id, db)

    prompt = AI_CHAT_PROMPT.format(
        project_context=project_context,
        meetings_context=meetings_context,
        tasks_context=tasks_context,
        question=data.question,
    )

    answer = await ollama_client.generate(prompt)

    # Strip thinking tags from answer
    import re
    answer = re.sub(r'<think>.*?</think>', '', answer, flags=re.DOTALL).strip()

    return ChatResponse(answer=answer)
