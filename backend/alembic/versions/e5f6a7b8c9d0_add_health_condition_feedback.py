"""add health_condition and feedback tables

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2025-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "e5f6a7b8c9d0"
down_revision = "d4e5f6a7b8c9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. health_condition
    op.create_table(
        "health_condition",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("patient_id", sa.String(36), sa.ForeignKey("patient.id"), nullable=False, index=True),
        sa.Column("condition_name", sa.String(255), nullable=False),
        sa.Column("severity", sa.String(50), nullable=True),
        sa.Column("diagnosed_date", sa.Date(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    # 2. feedback
    op.create_table(
        "feedback",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("user.id"), nullable=False, index=True),
        sa.Column("branch_id", sa.String(36), sa.ForeignKey("branch.id"), nullable=True),
        sa.Column("doctor_id", sa.String(36), sa.ForeignKey("doctor.id"), nullable=True),
        sa.Column("subject", sa.String(255), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("category", sa.String(50), server_default="general", nullable=True),
        sa.Column("status", sa.String(20), server_default="pending", nullable=False),
        sa.Column("admin_response", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("feedback")
    op.drop_table("health_condition")
