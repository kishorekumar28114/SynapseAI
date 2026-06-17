from fastapi import APIRouter, Depends, status, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database.session import get_db
from app.auth.dependencies import require_manager, get_current_active_user
from app.schemas.employee import EmployeeInvite, EmployeeOut, EmployeeUpdateRole, EmployeeResetPassword
from app.services.employee_service import EmployeeService
from app.models.user import User

router = APIRouter(prefix="/employees", tags=["Employees"])


@router.post("/invite", response_model=dict, status_code=status.HTTP_201_CREATED)
def invite_employee(
    data: EmployeeInvite,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    """Invite a new employee — generates credentials and sends onboarding email."""
    user, temp_password = EmployeeService.invite_employee(data, current_user, db, background_tasks)
    return {
        "message": f"Employee {user.full_name} invited successfully.",
        "username": user.username,
        "temp_password": temp_password,
        "email_sent_to": user.email,
    }


@router.get("", response_model=List[EmployeeOut])
def list_employees(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    employees = EmployeeService.list_employees(db)
    return [EmployeeOut.model_validate(e) for e in employees]


@router.get("/{user_id}", response_model=EmployeeOut)
def get_employee(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    user = EmployeeService.get_employee(user_id, db)
    return EmployeeOut.model_validate(user)


@router.patch("/{user_id}/deactivate", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_employee(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    EmployeeService.deactivate_employee(user_id, db)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    """Permanently delete an employee account."""
    EmployeeService.delete_employee(user_id, db)


@router.post("/{user_id}/reset-password", response_model=dict)
def reset_employee_password(
    user_id: UUID,
    data: EmployeeResetPassword,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    msg = EmployeeService.reset_password(user_id, data.new_password, db)
    return {"message": msg}
