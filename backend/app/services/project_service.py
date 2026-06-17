import os
import re
import shutil
from typing import List, Optional
from uuid import UUID
from pathlib import Path
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.team_member import TeamMember
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.config import settings


def _extract_text_from_file(file_path: str, extension: str) -> str:
    """Extract raw text from uploaded requirement files."""
    if extension == "txt":
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    elif extension == "pdf":
        try:
            import pypdf
            reader = pypdf.PdfReader(file_path)
            return "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as e:
            return f"[PDF extraction error: {e}]"
    elif extension == "docx":
        try:
            from docx import Document
            doc = Document(file_path)
            return "\n".join(p.text for p in doc.paragraphs)
        except Exception as e:
            return f"[DOCX extraction error: {e}]"
    return ""


class ProjectService:

    @staticmethod
    def create_project(data: ProjectCreate, created_by: UUID, db: Session) -> Project:
        project = Project(
            name=data.name,
            description=data.description,
            created_by=created_by,
            ai_analysis_status="pending",
        )
        db.add(project)
        db.commit()
        db.refresh(project)
        return project

    @staticmethod
    def get_project(project_id: UUID, db: Session) -> Project:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found.")
        return project

    @staticmethod
    def get_projects_for_team(team_id: UUID, db: Session) -> List[Project]:
        return db.query(Project).filter(Project.team_id == team_id).all()

    @staticmethod
    def get_projects_for_manager(manager_id: UUID, db: Session) -> List[Project]:
        return db.query(Project).filter(Project.created_by == manager_id).all()

    @staticmethod
    def get_projects_for_user(user_id: UUID, db: Session) -> List[Project]:
        """Get all projects for the teams that a user belongs to."""
        team_ids = [
            tm.team_id
            for tm in db.query(TeamMember).filter(TeamMember.user_id == user_id).all()
        ]
        if not team_ids:
            return []
        return (
            db.query(Project)
            .filter(Project.team_id.in_(team_ids))
            .all()
        )

    @staticmethod
    def update_project(project_id: UUID, data: ProjectUpdate, db: Session) -> Project:
        project = ProjectService.get_project(project_id, db)
        if data.name is not None:
            project.name = data.name
        if data.description is not None:
            project.description = data.description
        if data.client_requirements is not None:
            project.client_requirements = data.client_requirements
        if data.deadline is not None:
            project.deadline = data.deadline
        if data.budget is not None:
            project.budget = data.budget
        if data.team_id is not None:
            project.team_id = data.team_id
        db.commit()
        db.refresh(project)
        return project

    @staticmethod
    def delete_project(project_id: UUID, manager_id: UUID, db: Session) -> None:
        project = ProjectService.get_project(project_id, db)
        if str(project.created_by) != str(manager_id):
            raise HTTPException(status_code=403, detail="Not authorized to delete this project.")
        # Clean up file if exists
        if project.requirements_file_path and os.path.exists(project.requirements_file_path):
            try:
                os.remove(project.requirements_file_path)
            except Exception:
                pass
        db.delete(project)
        db.commit()

    @staticmethod
    async def upload_requirements_file(
        project_id: UUID, file: UploadFile, db: Session
    ) -> Project:
        project = ProjectService.get_project(project_id, db)
        extension = (file.filename or "").split(".")[-1].lower()
        if extension not in ["pdf", "docx", "txt"]:
            raise HTTPException(status_code=400, detail="Only PDF, DOCX, TXT files are allowed.")

        upload_dir = Path(settings.UPLOAD_DIR) / "requirements"
        upload_dir.mkdir(parents=True, exist_ok=True)
        file_path = upload_dir / f"{project_id}.{extension}"

        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        # Extract text and update requirements
        extracted_text = _extract_text_from_file(str(file_path), extension)
        project.requirements_file_path = str(file_path)
        if extracted_text:
            project.client_requirements = extracted_text
        project.ai_analysis_status = "pending"

        db.commit()
        db.refresh(project)
        return project

    @staticmethod
    async def analyze_project(project_id: UUID, db: Session) -> Project:
        """Run AI analysis on the project requirements file."""
        from app.ai.ollama_client import ollama_client
        from app.ai.prompts import PROJECT_ANALYSIS_PROMPT

        project = ProjectService.get_project(project_id, db)
        if not project.client_requirements:
            raise HTTPException(
                status_code=400,
                detail="No requirements text found. Please upload a requirements file first."
            )

        project.ai_analysis_status = "analyzing"
        db.commit()

        try:
            prompt = PROJECT_ANALYSIS_PROMPT.format(
                requirements_text=project.client_requirements[:8000]
            )
            result = await ollama_client.generate_json(prompt)

            project.ai_difficulty = result.get("difficulty")
            project.ai_teams_needed = result.get("teams_needed")
            project.ai_budget_estimate = result.get("budget_estimate")
            project.ai_time_estimate = result.get("time_estimate")
            project.ai_analysis_summary = result.get("summary")
            project.ai_analysis_status = "done"

        except Exception as e:
            project.ai_analysis_status = "failed"
            project.ai_analysis_summary = f"Analysis failed: {str(e)}"

        db.commit()
        db.refresh(project)
        return project
