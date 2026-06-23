"""
Role-aware retrieval context builders for AI chat.
Manager: project-scoped, cross-team view.
Employee: team-scoped, personal task view.
"""
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.meeting import Meeting
from app.models.task import Task
from app.models.project import Project
from app.models.team import Team
from app.models.ai_analysis import AIAnalysis


# ─── Shared helpers ────────────────────────────────────────────────────────────

def _project_text(p: Project) -> str:
    ai_info = ""
    if p.ai_analysis_status == "done":
        ai_info = (
            f"\n  AI Difficulty: {p.ai_difficulty or 'N/A'}"
            f"\n  AI Teams Needed: {p.ai_teams_needed or 'N/A'}"
            f"\n  Budget Estimate: {p.ai_budget_estimate or 'N/A'}"
            f"\n  Time Estimate: {p.ai_time_estimate or 'N/A'}"
            f"\n  AI Summary: {p.ai_analysis_summary or 'N/A'}"
        )
    return (
        f"Project: {p.name}\n"
        f"Description: {p.description or 'N/A'}\n"
        f"Requirements (excerpt): {(p.client_requirements or '')[:800]}\n"
        f"Deadline: {p.deadline or 'Not set'} | Budget: {p.budget or 'Not set'}"
        + ai_info
    )


def _meetings_text(meetings: List[Meeting]) -> str:
    if not meetings:
        return "No meetings recorded yet."
    parts = []
    for m in meetings:
        analysis = m.ai_analysis
        summary = analysis.summary[:400] if analysis and analysis.summary else "Not analyzed yet"
        eff = f"{analysis.meeting_efficiency_score:.0f}%" if analysis and analysis.meeting_efficiency_score else "N/A"
        sentiment = analysis.overall_sentiment or "N/A" if analysis else "N/A"
        parts.append(
            f"Meeting: {m.title} ({m.created_at.strftime('%Y-%m-%d')})\n"
            f"  Status: {m.status} | Efficiency: {eff} | Sentiment: {sentiment}\n"
            f"  Summary: {summary}"
        )
    return "\n\n".join(parts)


def _tasks_text(tasks: List[Task], label: str = "Tasks") -> str:
    if not tasks:
        return f"No {label.lower()} found."
    lines = []
    for t in tasks:
        deadline = str(t.deadline) if t.deadline else t.extracted_deadline_text or "No deadline"
        assignee = t.assignee.full_name if t.assignee else "Unassigned"
        lines.append(
            f"  - [{t.priority.upper()}] {t.title} | Assignee: {assignee} | Due: {deadline} | Status: {t.status}"
        )
    return f"{label}:\n" + "\n".join(lines)


# ─── Manager Retrieval ─────────────────────────────────────────────────────────

class ManagerRetrievalService:
    """
    Broad, project-scoped context for managers.
    Covers all teams linked to the selected project.
    """

    @staticmethod
    def build_context(project_id: UUID, db: Session) -> dict:
        # 1. Project details
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return {
                "project": "Project not found.",
                "teams": "No teams.",
                "meetings_efficiency": "No meeting data.",
                "tasks_summary": "No tasks.",
            }

        project_ctx = _project_text(project)

        # 2. All teams linked to this project (both sides of the relationship)
        teams_by_project_team_id = db.query(Team).filter(Team.project_id == project_id, Team.is_active == True).all()
        teams_by_project_fk = db.query(Team).filter(Team.id == project.team_id, Team.is_active == True).all() if project.team_id else []
        all_team_ids = {t.id for t in teams_by_project_team_id + teams_by_project_fk}
        teams = db.query(Team).filter(Team.id.in_(all_team_ids)).all() if all_team_ids else []

        teams_ctx_parts = []
        meetings_eff_parts = []
        tasks_parts = []

        for team in teams:
            # Team summary line
            teams_ctx_parts.append(
                f"Team: {team.name} | Members: {len(team.members)}"
            )

            # Last 3 meetings per team
            meetings = (
                db.query(Meeting)
                .filter(Meeting.team_id == team.id)
                .order_by(Meeting.created_at.desc())
                .limit(3)
                .all()
            )
            if meetings:
                meetings_eff_parts.append(f"[{team.name}]\n" + _meetings_text(meetings))

            # Tasks from recent 5 meetings
            meeting_ids = [m.id for m in meetings]
            tasks = (
                db.query(Task)
                .filter(Task.meeting_id.in_(meeting_ids))
                .order_by(Task.deadline.asc().nullslast())
                .limit(20)
                .all()
            )
            if tasks:
                tasks_parts.append(_tasks_text(tasks, label=f"[{team.name}] Tasks"))

        return {
            "project": project_ctx,
            "teams": "\n".join(teams_ctx_parts) if teams_ctx_parts else "No teams assigned to this project yet.",
            "meetings_efficiency": "\n\n".join(meetings_eff_parts) if meetings_eff_parts else "No meeting data.",
            "tasks_summary": "\n\n".join(tasks_parts) if tasks_parts else "No tasks extracted yet.",
        }


# ─── Employee Retrieval ────────────────────────────────────────────────────────

class EmployeeRetrievalService:
    """
    Narrow, team-scoped context for employees.
    Includes personal tasks filtered by user_id.
    """

    @staticmethod
    def build_context(team_id: UUID, user_id: UUID, db: Session) -> dict:
        # 1. Project linked to this team
        team = db.query(Team).filter(Team.id == team_id).first()
        project_ctx = "No project assigned to your team."
        if team:
            project = None
            if team.project_id:
                project = db.query(Project).filter(Project.id == team.project_id).first()
            if not project and team.projects:
                project = team.projects[0]
            if project:
                project_ctx = _project_text(project)

        # 2. Last 3 team meetings
        meetings = (
            db.query(Meeting)
            .filter(Meeting.team_id == team_id)
            .order_by(Meeting.created_at.desc())
            .limit(3)
            .all()
        )
        meetings_ctx = _meetings_text(meetings)

        # 3. All team tasks from recent meetings
        meeting_ids = [m.id for m in meetings]
        all_tasks = (
            db.query(Task)
            .filter(Task.meeting_id.in_(meeting_ids))
            .order_by(Task.deadline.asc().nullslast())
            .limit(20)
            .all()
        ) if meeting_ids else []
        team_tasks_ctx = _tasks_text(all_tasks, "Team Tasks")

        # 4. Personal tasks (filtered by assignee)
        my_tasks = [t for t in all_tasks if t.assignee_id and str(t.assignee_id) == str(user_id)]
        my_tasks_ctx = _tasks_text(my_tasks, "Your Personal Tasks")

        return {
            "project": project_ctx,
            "meetings": meetings_ctx,
            "team_tasks": team_tasks_ctx,
            "my_tasks": my_tasks_ctx,
        }
