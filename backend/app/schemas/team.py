from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class TeamCreate(BaseModel):
    name: str
    description: Optional[str] = None
    project_id: Optional[UUID] = None  # Manager optionally assigns a project to this team


class TeamUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    project_id: Optional[UUID] = None


class MemberAdd(BaseModel):
    user_id: UUID
    role_in_team: str = "team_member"  # "team_lead" or "team_member"


class TeamMemberOut(BaseModel):
    id: UUID
    user_id: UUID
    full_name: str
    username: str
    email: Optional[str]
    role_in_team: str
    joined_at: datetime

    model_config = {"from_attributes": True}


class TeamOut(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    manager_id: UUID
    is_active: bool
    created_at: datetime
    member_count: int = 0
    project_id: Optional[UUID] = None

    model_config = {"from_attributes": True}


class TeamDetailOut(TeamOut):
    members: List[TeamMemberOut] = []
