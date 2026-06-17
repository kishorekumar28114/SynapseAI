from typing import List
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.meeting import Meeting
from app.models.task import Task
from app.models.project import Project
from app.models.team import Team
from app.models.ai_analysis import AIAnalysis


class RetrievalService:
    """
    Retrieves relevant context from the database for AI chat.
    Correctly retrieves project context via Team.project_id or Project.team_id.
    """

    @staticmethod
    def get_project_context(team_id: UUID, db: Session) -> str:
        # Strategy 1: projects assigned to this team (team_id FK on project)
        projects = db.query(Project).filter(Project.team_id == team_id).all()

        # Strategy 2: project assigned via team.project_id
        team = db.query(Team).filter(Team.id == team_id).first()
        if team and team.project_id:
            team_project = db.query(Project).filter(Project.id == team.project_id).first()
            if team_project and team_project not in projects:
                projects.append(team_project)

        if not projects:
            return "No project information available."

        parts = []
        for p in projects:
            ai_info = ""
            if p.ai_analysis_status == "done":
                ai_info = (
                    f"\nAI Analysis:\n"
                    f"  Difficulty: {p.ai_difficulty or 'N/A'}\n"
                    f"  Teams Needed: {p.ai_teams_needed or 'N/A'}\n"
                    f"  Budget Estimate: {p.ai_budget_estimate or 'N/A'}\n"
                    f"  Time Estimate: {p.ai_time_estimate or 'N/A'}\n"
                    f"  Summary: {p.ai_analysis_summary or 'N/A'}"
                )
            parts.append(
                f"Project: {p.name}\n"
                f"Description: {p.description or 'N/A'}\n"
                f"Requirements: {(p.client_requirements or '')[:500]}\n"
                f"Deadline: {p.deadline or 'Not set'}\n"
                f"Budget: {p.budget or 'Not set'}"
                + ai_info
            )
        return "\n\n".join(parts)

    @staticmethod
    def get_recent_meetings_context(team_id: UUID, db: Session, limit: int = 3) -> str:
        meetings = (
            db.query(Meeting)
            .filter(Meeting.team_id == team_id)
            .order_by(Meeting.created_at.desc())
            .limit(limit)
            .all()
        )
        if not meetings:
            return "No meetings recorded yet."
        parts = []
        for m in meetings:
            analysis = m.ai_analysis
            summary = analysis.summary[:300] if analysis and analysis.summary else "Not analyzed yet"
            parts.append(
                f"Meeting: {m.title} ({m.created_at.strftime('%Y-%m-%d')})\n"
                f"Status: {m.status}\n"
                f"Summary: {summary}"
            )
        return "\n\n".join(parts)

    @staticmethod
    def get_tasks_context(team_id: UUID, db: Session) -> str:
        meetings = (
            db.query(Meeting)
            .filter(Meeting.team_id == team_id)
            .order_by(Meeting.created_at.desc())
            .limit(5)
            .all()
        )
        meeting_ids = [m.id for m in meetings]
        tasks = (
            db.query(Task)
            .filter(Task.meeting_id.in_(meeting_ids))
            .order_by(Task.deadline.asc().nullslast())
            .limit(20)
            .all()
        )
        if not tasks:
            return "No tasks extracted yet."
        lines = []
        for t in tasks:
            deadline = str(t.deadline) if t.deadline else t.extracted_deadline_text or "No deadline"
            assignee = t.assignee.full_name if t.assignee else "Unassigned"
            lines.append(
                f"- [{str(t.priority).upper()}] {t.title} | Assignee: {assignee} | Due: {deadline} | Status: {t.status}"
            )
        return "\n".join(lines)
