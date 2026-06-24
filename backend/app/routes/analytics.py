from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import UUID
from typing import List, Optional
from pydantic import BaseModel

from app.database.session import get_db
from app.auth.dependencies import require_manager, get_current_active_user
from app.models.meeting import Meeting, MeetingStatus
from app.models.ai_analysis import AIAnalysis
from app.models.task import Task, TaskStatus, TaskPriority
from app.models.user import User

router = APIRouter(prefix="/analytics", tags=["Analytics"])


class TeamAnalytics(BaseModel):
    total_meetings: int
    completed_meetings: int
    pending_meetings: int
    avg_efficiency_score: Optional[float]
    avg_sentiment_score: Optional[float]
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    task_by_priority: dict


class MeetingAnalyticsOut(BaseModel):
    meeting_id: str
    title: str
    efficiency_score: Optional[float]
    sentiment_score: Optional[float]
    productive_pct: Optional[float]
    off_topic_pct: Optional[float]
    action_items_count: Optional[int]
    overall_sentiment: Optional[str]


@router.get("/team/{team_id}", response_model=TeamAnalytics)
def get_team_analytics(
    team_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    meetings = db.query(Meeting).filter(Meeting.team_id == team_id).all()
    meeting_ids = [m.id for m in meetings]

    analyses = db.query(AIAnalysis).filter(AIAnalysis.meeting_id.in_(meeting_ids)).all()
    tasks = db.query(Task).filter(Task.meeting_id.in_(meeting_ids)).all()

    completed_meetings = sum(1 for m in meetings if m.status == MeetingStatus.COMPLETED)

    avg_efficiency = (
        sum(a.meeting_efficiency_score for a in analyses if a.meeting_efficiency_score) / len(analyses)
        if analyses else None
    )
    avg_sentiment = (
        sum(a.sentiment_score for a in analyses if a.sentiment_score) / len(analyses)
        if analyses else None
    )

    completed_tasks = sum(1 for t in tasks if t.status == TaskStatus.COMPLETED)
    task_by_priority = {
        "critical": sum(1 for t in tasks if t.priority == TaskPriority.CRITICAL),
        "high": sum(1 for t in tasks if t.priority == TaskPriority.HIGH),
        "medium": sum(1 for t in tasks if t.priority == TaskPriority.MEDIUM),
        "low": sum(1 for t in tasks if t.priority == TaskPriority.LOW),
    }

    return TeamAnalytics(
        total_meetings=len(meetings),
        completed_meetings=completed_meetings,
        pending_meetings=len(meetings) - completed_meetings,
        avg_efficiency_score=round(avg_efficiency, 1) if avg_efficiency else None,
        avg_sentiment_score=round(avg_sentiment, 3) if avg_sentiment else None,
        total_tasks=len(tasks),
        completed_tasks=completed_tasks,
        pending_tasks=len(tasks) - completed_tasks,
        task_by_priority=task_by_priority,
    )


@router.get("/meetings/{team_id}", response_model=List[MeetingAnalyticsOut])
def get_meetings_analytics(
    team_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    meetings = db.query(Meeting).filter(Meeting.team_id == team_id).all()
    result = []
    for m in meetings:
        a = m.ai_analysis
        result.append(MeetingAnalyticsOut(
            meeting_id=str(m.id),
            title=m.title,
            efficiency_score=a.meeting_efficiency_score if a else None,
            sentiment_score=a.sentiment_score if a else None,
            productive_pct=a.productive_discussion_pct if a else None,
            off_topic_pct=a.off_topic_discussion_pct if a else None,
            action_items_count=a.action_items_count if a else None,
            overall_sentiment=a.overall_sentiment if a else None,
        ))
    return result


@router.get("/meeting/{meeting_id}/detail")
def get_meeting_analysis_detail(
    meeting_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Full AI analysis detail for a single meeting."""
    analysis = db.query(AIAnalysis).filter(AIAnalysis.meeting_id == meeting_id).first()
    if not analysis:
        return {"message": "No analysis available yet."}

    tasks = db.query(Task).filter(Task.meeting_id == meeting_id).all()

    # Fallback: if no tasks in DB but raw response has them, parse from stored JSON
    tasks_out = [
        {
            "id": str(t.id),
            "title": t.title,
            "description": t.description,
            "priority": t.priority,
            "status": t.status,
            "deadline": str(t.deadline) if t.deadline else t.extracted_deadline_text,
            "assignee": t.assignee.full_name if t.assignee else None,
        }
        for t in tasks
    ]

    if not tasks_out and analysis.raw_tasks_response:
        raw_tasks = analysis.raw_tasks_response.get("tasks", [])
        tasks_out = [
            {
                "id": f"raw-{i}",
                "title": rt.get("title", "Untitled Task"),
                "description": rt.get("description"),
                "priority": rt.get("priority", "medium"),
                "status": "pending",
                "deadline": rt.get("deadline_text"),
                "assignee": rt.get("assignee_name"),
            }
            for i, rt in enumerate(raw_tasks)
        ]

    return {
        "summary": analysis.summary,
        "key_points": analysis.key_points,
        "overall_sentiment": analysis.overall_sentiment,
        "sentiment_score": analysis.sentiment_score,
        "meeting_efficiency_score": analysis.meeting_efficiency_score,
        "productive_discussion_pct": analysis.productive_discussion_pct,
        "off_topic_discussion_pct": analysis.off_topic_discussion_pct,
        "action_items_count": analysis.action_items_count,
        "participation_insights": analysis.participation_insights,
        "improvement_suggestions": analysis.raw_metrics_response.get("improvement_suggestions", []) if analysis.raw_metrics_response else [],
        "decisions_made": analysis.raw_summary_response.get("decisions_made", []) if analysis.raw_summary_response else [],
        "processing_time_seconds": analysis.processing_time_seconds,
        "model_used": analysis.model_used,
        "tasks": tasks_out,
    }
