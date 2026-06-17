"""add_project_ai_fields_and_team_project_id

Revision ID: a1b2c3d4e5f6
Revises: 9c79a8fd903d
Create Date: 2026-06-17 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '9c79a8fd903d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    1. Make projects.team_id nullable (project is created standalone, then assigned via team)
    2. Add AI analysis columns to projects
    3. Add project_id FK to teams (manager assigns a project to a team)
    """

    # 1. Make projects.team_id nullable
    op.alter_column(
        'projects', 'team_id',
        existing_type=sa.UUID(),
        nullable=True
    )

    # 2. Add AI analysis fields to projects
    op.add_column('projects', sa.Column('ai_difficulty', sa.String(length=50), nullable=True))
    op.add_column('projects', sa.Column('ai_teams_needed', sa.Integer(), nullable=True))
    op.add_column('projects', sa.Column('ai_budget_estimate', sa.Text(), nullable=True))
    op.add_column('projects', sa.Column('ai_time_estimate', sa.Text(), nullable=True))
    op.add_column('projects', sa.Column('ai_analysis_summary', sa.Text(), nullable=True))
    op.add_column('projects', sa.Column('ai_analysis_status', sa.String(length=30), nullable=True, server_default='pending'))

    # 3. Add project_id to teams
    op.add_column('teams', sa.Column('project_id', sa.UUID(), nullable=True))
    op.create_foreign_key(
        'fk_teams_project_id',
        'teams', 'projects',
        ['project_id'], ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    """Reverse all changes."""
    # Drop team.project_id
    op.drop_constraint('fk_teams_project_id', 'teams', type_='foreignkey')
    op.drop_column('teams', 'project_id')

    # Drop AI fields from projects
    op.drop_column('projects', 'ai_analysis_status')
    op.drop_column('projects', 'ai_analysis_summary')
    op.drop_column('projects', 'ai_time_estimate')
    op.drop_column('projects', 'ai_budget_estimate')
    op.drop_column('projects', 'ai_teams_needed')
    op.drop_column('projects', 'ai_difficulty')

    # Make projects.team_id NOT NULL again
    op.alter_column(
        'projects', 'team_id',
        existing_type=sa.UUID(),
        nullable=False
    )
