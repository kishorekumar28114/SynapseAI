from app.database.base import Base

# Import all models so Alembic can detect them
from app.models.user import User
from app.models.team import Team
from app.models.team_member import TeamMember
from app.models.project import Project
from app.models.meeting import Meeting
from app.models.transcript import Transcript
from app.models.task import Task
from app.models.ai_analysis import AIAnalysis

__all__ = [
    "Base",
    "User",
    "Team",
    "TeamMember",
    "Project",
    "Meeting",
    "Transcript",
    "Task",
    "AIAnalysis",
]
