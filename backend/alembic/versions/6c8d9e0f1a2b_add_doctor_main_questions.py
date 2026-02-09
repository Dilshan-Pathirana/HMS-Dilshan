"""add doctor main questions tables

Revision ID: 6c8d9e0f1a2b
Revises: 14f6a7b8c9d0, 52a1b9c3d4e8
Create Date: 2026-02-09 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "6c8d9e0f1a2b"
down_revision = ("14f6a7b8c9d0", "52a1b9c3d4e8")
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "doctor_main_question",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("doctor_id", sa.String(36), nullable=False, index=True),
        sa.Column("question", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("status", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "doctor_main_question_answer",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("question_id", sa.String(36), nullable=False, index=True),
        sa.Column("answer", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("doctor_main_question_answer")
    op.drop_table("doctor_main_question")
