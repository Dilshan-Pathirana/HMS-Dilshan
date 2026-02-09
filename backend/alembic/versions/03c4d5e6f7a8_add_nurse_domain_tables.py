"""Add vital_sign and nurse_handover tables

Revision ID: 03c4d5e6f7a8
Revises: 02b3c4d5e6f7
Create Date: 2025-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "03c4d5e6f7a8"
down_revision = "02b3c4d5e6f7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "vital_sign",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("patient_id", sa.String(36), sa.ForeignKey("patient.id"), nullable=False, index=True),
        sa.Column("nurse_id", sa.String(36), nullable=False, index=True),
        sa.Column("appointment_id", sa.String(36), nullable=True),
        sa.Column("temperature", sa.Float(), nullable=True),
        sa.Column("blood_pressure_systolic", sa.Integer(), nullable=True),
        sa.Column("blood_pressure_diastolic", sa.Integer(), nullable=True),
        sa.Column("pulse_rate", sa.Integer(), nullable=True),
        sa.Column("respiratory_rate", sa.Integer(), nullable=True),
        sa.Column("oxygen_saturation", sa.Float(), nullable=True),
        sa.Column("weight", sa.Float(), nullable=True),
        sa.Column("height", sa.Float(), nullable=True),
        sa.Column("bmi", sa.Float(), nullable=True),
        sa.Column("blood_sugar", sa.Float(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("recorded_at", sa.DateTime(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "nurse_handover",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("from_nurse_id", sa.String(36), nullable=False, index=True),
        sa.Column("to_nurse_id", sa.String(36), nullable=False),
        sa.Column("branch_id", sa.String(36), nullable=True),
        sa.Column("shift_date", sa.Date(), nullable=False),
        sa.Column("shift_type", sa.String(20), nullable=False),
        sa.Column("patient_summary", sa.Text(), nullable=True),
        sa.Column("pending_tasks", sa.Text(), nullable=True),
        sa.Column("critical_notes", sa.Text(), nullable=True),
        sa.Column("status", sa.String(20), server_default=sa.text("'pending'")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("acknowledged_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("nurse_handover")
    op.drop_table("vital_sign")
