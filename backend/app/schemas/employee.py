from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.models.user import UserRole


class EmployeeInvite(BaseModel):
    full_name: str
    email: EmailStr
    role: UserRole  # team_lead or team_member
    team_id: Optional[UUID] = None


class EmployeeOut(BaseModel):
    id: UUID
    username: str
    full_name: str
    email: Optional[str]
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class EmployeeUpdateRole(BaseModel):
    role: UserRole


class EmployeeResetPassword(BaseModel):
    new_password: str
