import time
import logging
from datetime import datetime
from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.meeting import Meeting, MeetingStatus, MeetingFileType
from app.models.transcript import Transcript
from app.models.task import Task, TaskPriority, TaskStatus
from app.models.ai_analysis import AIAnalysis
from app.ai.transcription import transcribe_audio, extract_text_from_document
from app.ai.ollama_client import ollama_client
from app.ai.prompts import (
    MEETING_SUMMARY_PROMPT,
    TASK_EXTRACTION_PROMPT,
    SENTIMENT_ANALYSIS_PROMPT,
    PRODUCTIVITY_METRICS_PROMPT,
)
from app.config import settings

logger = logging.getLogger(__name__)

AUDIO_TYPES = {
    MeetingFileType.AUDIO_MP3,
    MeetingFileType.AUDIO_WAV,
    MeetingFileType.AUDIO_M4A,
    MeetingFileType.AUDIO_OGG,
}


def _map_priority(priority_str: str) -> TaskPriority:
    mapping = {
        "low": TaskPriority.LOW,
        "medium": TaskPriority.MEDIUM,
        "high": TaskPriority.HIGH,
        "critical": TaskPriority.CRITICAL,
    }
    return mapping.get(str(priority_str).lower(), TaskPriority.MEDIUM)


def _parse_date(date_str: Optional[str]):
    if not date_str:
        return None
    for fmt in ["%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y"]:
        try:
            return datetime.strptime(date_str, fmt).date()
        except (ValueError, TypeError):
            continue
    return None


async def process_meeting(meeting_id: UUID, db: Session) -> None:
    """
    Full AI processing pipeline for a meeting:
    1. Get transcript (transcribe audio or extract from doc)
    2. Store transcript
    3. Run AI: summary, tasks, sentiment, productivity
    4. Store results
    """
    meeting: Optional[Meeting] = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        logger.error(f"Meeting {meeting_id} not found")
        return

    start_time = time.time()

    try:
        # ── Step 1: Get Transcript ──────────────────────────────────────────
        meeting.status = MeetingStatus.TRANSCRIBING
        db.commit()

        if meeting.file_type in AUDIO_TYPES:
            transcript_text, duration = await transcribe_audio(meeting.file_path)
            if duration:
                meeting.duration_seconds = int(duration)
        else:
            transcript_text = extract_text_from_document(meeting.file_path)
            duration = None

        if not transcript_text.strip():
            meeting.status = MeetingStatus.FAILED
            db.commit()
            logger.error(f"Empty transcript for meeting {meeting_id}")
            return

        # ── Step 2: Store Transcript ────────────────────────────────────────
        transcript = Transcript(
            meeting_id=meeting.id,
            raw_text=transcript_text,
            word_count=len(transcript_text.split()),
        )
        db.add(transcript)
        meeting.status = MeetingStatus.PROCESSING
        db.commit()

        # ── Step 3: Build context ───────────────────────────────────────────
        project_context = ""
        team_members_list = "Unknown"
        if meeting.project:
            proj = meeting.project
            project_context = f"Project: {proj.name}\n{proj.description or ''}\n{proj.client_requirements or ''}"
        if meeting.team and meeting.team.members:
            team_members_list = ", ".join(m.user.full_name for m in meeting.team.members)

        duration_minutes = (meeting.duration_seconds or 0) // 60

        # ── Step 4: AI Calls ────────────────────────────────────────────────
        # Summary
        summary_prompt = MEETING_SUMMARY_PROMPT.format(
            transcript=transcript_text[:8000],  # Limit to ~8k chars
            project_context=project_context,
        )
        summary_data = await ollama_client.generate_json(summary_prompt)

        # Task extraction
        task_prompt = TASK_EXTRACTION_PROMPT.format(
            transcript=transcript_text[:8000],
            team_members=team_members_list,
        )
        task_data = await ollama_client.generate_json(task_prompt)

        # Sentiment
        sentiment_prompt = SENTIMENT_ANALYSIS_PROMPT.format(
            transcript=transcript_text[:8000],
        )
        sentiment_data = await ollama_client.generate_json(sentiment_prompt)

        # Productivity (needs task count)
        tasks_list = task_data.get("tasks", [])
        productivity_prompt = PRODUCTIVITY_METRICS_PROMPT.format(
            transcript=transcript_text[:6000],
            task_count=len(tasks_list),
            duration_minutes=duration_minutes,
        )
        productivity_data = await ollama_client.generate_json(productivity_prompt)

        # ── Step 5: Store Tasks ─────────────────────────────────────────────
        for task_item in tasks_list:
            task = Task(
                meeting_id=meeting.id,
                title=task_item.get("title", "Untitled Task")[:500],
                description=task_item.get("description"),
                priority=_map_priority(task_item.get("priority", "medium")),
                deadline=_parse_date(task_item.get("deadline_date")),
                extracted_deadline_text=task_item.get("deadline_text"),
                status=TaskStatus.PENDING,
                is_ai_extracted=True,
            )
            db.add(task)

        # ── Step 6: Store AI Analysis ───────────────────────────────────────
        processing_time = time.time() - start_time

        analysis = db.query(AIAnalysis).filter(AIAnalysis.meeting_id == meeting.id).first()
        if not analysis:
            analysis = AIAnalysis(meeting_id=meeting.id)
            db.add(analysis)

        analysis.summary = summary_data.get("summary", "")
        analysis.key_points = summary_data.get("key_points", [])
        analysis.overall_sentiment = sentiment_data.get("overall_sentiment", "neutral")
        analysis.sentiment_score = float(sentiment_data.get("sentiment_score", 0.0))
        analysis.meeting_efficiency_score = float(productivity_data.get("meeting_efficiency_score", 0))
        analysis.productive_discussion_pct = float(productivity_data.get("productive_discussion_pct", 0))
        analysis.off_topic_discussion_pct = float(productivity_data.get("off_topic_discussion_pct", 0))
        analysis.action_items_count = len(tasks_list)
        analysis.participation_insights = sentiment_data.get("participation_insights", [])
        analysis.raw_summary_response = summary_data
        analysis.raw_tasks_response = task_data
        analysis.raw_sentiment_response = sentiment_data
        analysis.raw_metrics_response = productivity_data
        analysis.processing_time_seconds = processing_time
        analysis.model_used = settings.OLLAMA_MODEL

        meeting.status = MeetingStatus.COMPLETED
        db.commit()

        logger.info(f"Meeting {meeting_id} processed in {processing_time:.1f}s")

    except Exception as e:
        logger.error(f"AI processing failed for meeting {meeting_id}: {e}", exc_info=True)
        meeting.status = MeetingStatus.FAILED
        db.commit()
