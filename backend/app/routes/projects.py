from fastapi import APIRouter, Depends, status, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database.session import get_db
from app.auth.dependencies import require_manager, get_current_active_user
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectOut
from app.services.project_service import ProjectService
from app.models.user import User

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(
    data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    """Create a new project (name + description only). Upload requirements file separately."""
    project = ProjectService.create_project(data, current_user.id, db)
    return ProjectOut.model_validate(project)


@router.get("", response_model=List[ProjectOut])
def list_my_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    """Manager: list all projects they created."""
    projects = ProjectService.get_projects_for_manager(current_user.id, db)
    return [ProjectOut.model_validate(p) for p in projects]


@router.get("/my-team", response_model=List[ProjectOut])
def list_my_team_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Employee/Team Lead: list projects for their teams."""
    projects = ProjectService.get_projects_for_user(current_user.id, db)
    return [ProjectOut.model_validate(p) for p in projects]


@router.get("/team/{team_id}", response_model=List[ProjectOut])
def list_projects_for_team(
    team_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    projects = ProjectService.get_projects_for_team(team_id, db)
    return [ProjectOut.model_validate(p) for p in projects]


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    project = ProjectService.get_project(project_id, db)
    return ProjectOut.model_validate(project)


@router.put("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: UUID,
    data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    project = ProjectService.update_project(project_id, data, db)
    return ProjectOut.model_validate(project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    """Delete a project (manager only)."""
    ProjectService.delete_project(project_id, current_user.id, db)


@router.post("/{project_id}/upload-requirements", response_model=ProjectOut)
async def upload_requirements(
    project_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    """Upload a requirements file and extract text."""
    project = await ProjectService.upload_requirements_file(project_id, file, db)
    return ProjectOut.model_validate(project)


@router.post("/{project_id}/analyze", response_model=ProjectOut)
async def analyze_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    """Trigger AI analysis of the project requirements. Returns difficulty, budget, time estimates."""
    project = await ProjectService.analyze_project(project_id, db)
    return ProjectOut.model_validate(project)
