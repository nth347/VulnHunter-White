"""Initial schema

Revision ID: ee5f44de351c
Revises:
Create Date: 2026-09-05 13:43:18.408894

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'ee5f44de351c'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _projects_columns() -> set:
    insp = sa.inspect(op.get_bind())
    if "projects" not in insp.get_table_names():
        return set()
    return {col["name"] for col in insp.get_columns("projects")}


def upgrade() -> None:
    cols = _projects_columns()
    if not cols or "language" in cols:
        return
    op.add_column(
        "projects",
        sa.Column("language", sa.String(length=8), server_default="en", nullable=False),
    )


def downgrade() -> None:
    if "language" not in _projects_columns():
        return
    op.drop_column("projects", "language")
