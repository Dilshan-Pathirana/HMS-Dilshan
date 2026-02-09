"""add doctor session and disease tables

Revision ID: 11c3d4e5f6a7
Revises: 10b2c3d4e5f6
Create Date: 2025-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "11c3d4e5f6a7"
down_revision = "10b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "doctor_session",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("doctor_id", sa.String(36), nullable=False, index=True),
        sa.Column("patient_id", sa.String(36), nullable=False, index=True),
        sa.Column("session_date", sa.Date, nullable=False),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("diagnosis", sa.String(1000), nullable=True),
        sa.Column("prescriptions", sa.Text, nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime, nullable=False),
        sa.Column("updated_at", sa.DateTime, nullable=False),
    )

    op.create_table(
        "doctor_created_disease",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("doctor_id", sa.String(36), nullable=False, index=True),
        sa.Column("disease_name", sa.String(300), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("symptoms", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )


def downgrade() -> None:
    op.drop_table("doctor_created_disease")
    op.drop_table("doctor_session")
