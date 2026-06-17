from typing import List
from uuid import UUID
from fastapi import HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import update

from app.models.user import User, UserRole
from app.models.team_member import TeamMember, MemberRole
from app.schemas.employee import EmployeeInvite
from app.auth.hashing import hash_password
from app.utils.generators import generate_username, generate_temp_password
from app.utils.email import send_onboarding_email


class EmployeeService:

    @staticmethod
    def invite_employee(
        data: EmployeeInvite,
        manager: User,
        db: Session,
        background_tasks: BackgroundTasks,
    ) -> tuple[User, str]:
        """
        Create employee account, generate credentials, send onboarding email.
        Returns (user, temp_password).
        """
        # Validate role (managers cannot invite other managers)
        if data.role == UserRole.MANAGER:
            raise HTTPException(
                status_code=400,
                detail="Cannot invite users with Manager role."
            )

        # Check email uniqueness
        if db.query(User).filter(User.email == data.email).first():
            raise HTTPException(
                status_code=409,
                detail="An account with this email already exists."
            )

        # Generate unique username
        existing_usernames = {u.username for u in db.query(User.username).all()}
        username = generate_username(data.full_name, existing_usernames)
        temp_password = generate_temp_password()

        user = User(
            email=data.email,
            username=username,
            full_name=data.full_name,
            password_hash=hash_password(temp_password),
            role=data.role,
            is_active=True,
        )
        db.add(user)
        db.flush()  # get user.id before commit

        # Add to team if specified
        if data.team_id:
            role_in_team = (
                MemberRole.TEAM_LEAD
                if data.role == UserRole.TEAM_LEAD
                else MemberRole.TEAM_MEMBER
            )
            membership = TeamMember(
                team_id=data.team_id,
                user_id=user.id,
                role_in_team=role_in_team,
            )
            db.add(membership)

        db.commit()
        db.refresh(user)

        # Send email in background (non-blocking)
        background_tasks.add_task(
            send_onboarding_email,
            to_email=data.email,
            full_name=data.full_name,
            username=username,
            temp_password=temp_password,
            role=data.role.value,
            manager_name=manager.full_name,
        )

        return user, temp_password

    @staticmethod
    def list_employees(db: Session) -> List[User]:
        return db.query(User).filter(User.role != UserRole.MANAGER).all()

    @staticmethod
    def get_employee(user_id: UUID, db: Session) -> User:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Employee not found.")
        return user

    @staticmethod
    def deactivate_employee(user_id: UUID, db: Session) -> None:
        user = EmployeeService.get_employee(user_id, db)
        user.is_active = False
        db.commit()

    @staticmethod
    def reset_password(user_id: UUID, new_password: str, db: Session) -> str:
        if len(new_password) < 8:
            raise HTTPException(status_code=400, detail="Password too short.")
        user = EmployeeService.get_employee(user_id, db)
        user.password_hash = hash_password(new_password)
        db.commit()
        return "Password reset successfully."

    @staticmethod
    def delete_employee(user_id: UUID, db: Session) -> None:
        """Permanently delete an employee. Removes their FK references first to avoid constraint errors."""
        from app.models.meeting import Meeting
        from app.models.task import Task
        from app.models.transcript import Transcript
        from app.models.ai_analysis import AIAnalysis

        user = EmployeeService.get_employee(user_id, db)

        # Get all meetings uploaded by this user so we can delete their children first
        meeting_ids = [
            m.id for m in db.query(Meeting.id).filter(Meeting.uploaded_by == user_id).all()
        ]
        if meeting_ids:
            # Delete meeting children (FK NOT NULL — cannot null them out)
            db.query(Task).filter(Task.meeting_id.in_(meeting_ids)).delete(synchronize_session=False)
            db.query(AIAnalysis).filter(AIAnalysis.meeting_id.in_(meeting_ids)).delete(synchronize_session=False)
            db.query(Transcript).filter(Transcript.meeting_id.in_(meeting_ids)).delete(synchronize_session=False)
            db.flush()
            # Now delete the meetings themselves
            db.query(Meeting).filter(Meeting.uploaded_by == user_id).delete(synchronize_session=False)

        # Unassign tasks assigned to this user (assignee_id IS nullable)
        db.query(Task).filter(Task.assignee_id == user_id).update(
            {"assignee_id": None}, synchronize_session=False
        )
        # Remove from any teams
        db.query(TeamMember).filter(TeamMember.user_id == user_id).delete(synchronize_session=False)

        db.flush()
        db.delete(user)
        db.commit()

