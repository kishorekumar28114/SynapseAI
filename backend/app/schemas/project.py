from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal


class ProjectCreate(BaseModel):
    """Manager just provides name + description. File is uploaded separately."""
    name: str
    description: Optional[str] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    client_requirements: Optional[str] = None
    deadline: Optional[date] = None
    budget: Optional[Decimal] = None
    team_id: Optional[UUID] = None


class ProjectOut(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    client_requirements: Optional[str]
    requirements_file_path: Optional[str]
    deadline: Optional[date]
    budget: Optional[Decimal]
    team_id: Optional[UUID]
    created_by: UUID
    created_at: datetime
    updated_at: Optional[datetime]

    # AI analysis fields
    ai_difficulty: Optional[str] = None
    ai_teams_needed: Optional[int] = None
    ai_budget_estimate: Optional[str] = None
    ai_time_estimate: Optional[str] = None
    ai_analysis_summary: Optional[str] = None
    ai_analysis_status: Optional[str] = None

    model_config = {"from_attributes": True}
