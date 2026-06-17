from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database.session import get_db
from app.auth.dependencies import require_manager, get_current_active_user
from app.schemas.team import TeamCreate, TeamUpdate, MemberAdd, TeamOut, TeamDetailOut
from app.services.team_service import TeamService
from app.models.user import User, UserRole

router = APIRouter(prefix="/teams", tags=["Teams"])


@router.post("", response_model=TeamDetailOut, status_code=status.HTTP_201_CREATED)
def create_team(
    data: TeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    team = TeamService.create_team(data, current_user.id, db)
    return TeamService.build_team_detail_out(team)


@router.get("", response_model=List[TeamOut])
def list_teams(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    teams = TeamService.get_teams_for_manager(current_user.id, db)
    return [TeamService.build_team_out(t) for t in teams]


@router.get("/my", response_model=List[TeamOut])
def my_teams(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return teams for the current user (works for all roles).
    For managers: teams they manage. For others: teams they're a member of."""
    if current_user.role == UserRole.MANAGER:
        teams = TeamService.get_teams_for_manager(current_user.id, db)
    else:
        teams = TeamService.get_teams_for_user(current_user.id, db)
    return [TeamService.build_team_out(t) for t in teams]


@router.get("/{team_id}", response_model=TeamDetailOut)
def get_team(
    team_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    team = TeamService.get_team_by_id(team_id, db)
    return TeamService.build_team_detail_out(team)


@router.put("/{team_id}", response_model=TeamDetailOut)
def update_team(
    team_id: UUID,
    data: TeamUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    team = TeamService.update_team(team_id, data, current_user.id, db)
    return TeamService.build_team_detail_out(team)


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team(
    team_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    TeamService.delete_team(team_id, current_user.id, db)


@router.post("/{team_id}/members", response_model=dict)
def add_member(
    team_id: UUID,
    data: MemberAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    TeamService.add_member(team_id, data, current_user.id, db)
    return {"message": "Member added successfully."}


@router.delete("/{team_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(
    team_id: UUID,
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    TeamService.remove_member(team_id, user_id, current_user.id, db)
