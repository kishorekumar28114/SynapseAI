from typing import List
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.team import Team
from app.models.team_member import TeamMember, MemberRole
from app.models.user import User, UserRole
from app.schemas.team import TeamCreate, TeamUpdate, MemberAdd, TeamOut, TeamDetailOut, TeamMemberOut


class TeamService:

    @staticmethod
    def create_team(data: TeamCreate, manager_id: UUID, db: Session) -> Team:
        team = Team(
            name=data.name,
            description=data.description,
            manager_id=manager_id,
            project_id=data.project_id if data.project_id else None,
        )
        db.add(team)
        db.commit()
        db.refresh(team)

        # If a project was assigned, update the project's team_id
        if data.project_id:
            from app.models.project import Project
            project = db.query(Project).filter(Project.id == data.project_id).first()
            if project:
                project.team_id = team.id
                db.commit()

        db.refresh(team)
        return team

    @staticmethod
    def get_teams_for_manager(manager_id: UUID, db: Session) -> List[Team]:
        return db.query(Team).filter(Team.manager_id == manager_id, Team.is_active == True).all()

    @staticmethod
    def get_teams_for_user(user_id: UUID, db: Session) -> List[Team]:
        """Get teams for any user (employee/team_lead) based on their memberships."""
        memberships = db.query(TeamMember).filter(TeamMember.user_id == user_id).all()
        team_ids = [m.team_id for m in memberships]
        if not team_ids:
            return []
        return db.query(Team).filter(Team.id.in_(team_ids), Team.is_active == True).all()

    @staticmethod
    def get_team_by_id(team_id: UUID, db: Session) -> Team:
        team = db.query(Team).filter(Team.id == team_id).first()
        if not team:
            raise HTTPException(status_code=404, detail="Team not found.")
        return team

    @staticmethod
    def update_team(team_id: UUID, data: TeamUpdate, manager_id: UUID, db: Session) -> Team:
        team = TeamService.get_team_by_id(team_id, db)
        if str(team.manager_id) != str(manager_id):
            raise HTTPException(status_code=403, detail="Not authorized to edit this team.")
        if data.name:
            team.name = data.name
        if data.description is not None:
            team.description = data.description
        if data.project_id is not None:
            team.project_id = data.project_id
            # Also update project's team_id
            from app.models.project import Project
            project = db.query(Project).filter(Project.id == data.project_id).first()
            if project:
                project.team_id = team.id
        db.commit()
        db.refresh(team)
        return team

    @staticmethod
    def delete_team(team_id: UUID, manager_id: UUID, db: Session) -> None:
        team = TeamService.get_team_by_id(team_id, db)
        if str(team.manager_id) != str(manager_id):
            raise HTTPException(status_code=403, detail="Not authorized.")
        team.is_active = False
        db.commit()

    @staticmethod
    def add_member(team_id: UUID, data: MemberAdd, manager_id: UUID, db: Session) -> TeamMember:
        team = TeamService.get_team_by_id(team_id, db)
        if str(team.manager_id) != str(manager_id):
            raise HTTPException(status_code=403, detail="Not authorized.")

        user = db.query(User).filter(User.id == data.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found.")

        # Check if already a member
        existing = db.query(TeamMember).filter(
            TeamMember.team_id == team_id,
            TeamMember.user_id == data.user_id
        ).first()
        if existing:
            raise HTTPException(status_code=409, detail="User is already a member of this team.")

        role = MemberRole.TEAM_LEAD if data.role_in_team == "team_lead" else MemberRole.TEAM_MEMBER
        member = TeamMember(team_id=team_id, user_id=data.user_id, role_in_team=role)
        db.add(member)
        db.commit()
        db.refresh(member)
        return member

    @staticmethod
    def remove_member(team_id: UUID, user_id: UUID, manager_id: UUID, db: Session) -> None:
        team = TeamService.get_team_by_id(team_id, db)
        if str(team.manager_id) != str(manager_id):
            raise HTTPException(status_code=403, detail="Not authorized.")
        member = db.query(TeamMember).filter(
            TeamMember.team_id == team_id,
            TeamMember.user_id == user_id
        ).first()
        if not member:
            raise HTTPException(status_code=404, detail="Member not found in team.")
        db.delete(member)
        db.commit()

    @staticmethod
    def build_team_out(team: Team) -> TeamOut:
        return TeamOut(
            id=team.id,
            name=team.name,
            description=team.description,
            manager_id=team.manager_id,
            is_active=team.is_active,
            created_at=team.created_at,
            member_count=len(team.members),
            project_id=team.project_id,
        )

    @staticmethod
    def build_team_detail_out(team: Team) -> TeamDetailOut:
        members = [
            TeamMemberOut(
                id=m.id,
                user_id=m.user_id,
                full_name=m.user.full_name,
                username=m.user.username,
                email=m.user.email,
                role_in_team=m.role_in_team,
                joined_at=m.joined_at,
            )
            for m in team.members
        ]
        return TeamDetailOut(
            id=team.id,
            name=team.name,
            description=team.description,
            manager_id=team.manager_id,
            is_active=team.is_active,
            created_at=team.created_at,
            member_count=len(members),
            members=members,
            project_id=team.project_id,
        )
