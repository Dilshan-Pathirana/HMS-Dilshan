"""add doctor schedule tables

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2025-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "c3d4e5f6a7b8"
down_revision = "b2c3d4e5f6a7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. doctor_schedule
    op.create_table(
        "doctor_schedule",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("doctor_id", sa.String(36), sa.ForeignKey("doctor.id"), nullable=False, index=True),
        sa.Column("branch_id", sa.String(36), sa.ForeignKey("branch.id"), nullable=False, index=True),
        sa.Column("day_of_week", sa.Integer(), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.Column("slot_duration_minutes", sa.Integer(), nullable=False, server_default="30"),
        sa.Column("max_patients", sa.Integer(), nullable=False, server_default="20"),
        sa.Column("status", sa.String(20), nullable=False, server_default="active"),
        sa.Column("recurrence_type", sa.String(20), nullable=False, server_default="weekly"),
        sa.Column("valid_from", sa.Date(), nullable=True),
        sa.Column("valid_until", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )

    # 2. doctor_schedule_cancellation
    op.create_table(
        "doctor_schedule_cancellation",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("doctor_id", sa.String(36), sa.ForeignKey("doctor.id"), nullable=False, index=True),
        sa.Column("schedule_id", sa.String(36), sa.ForeignKey("doctor_schedule.id"), nullable=False),
        sa.Column("cancel_date", sa.Date(), nullable=False),
        sa.Column("cancel_end_date", sa.Date(), nullable=True),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("approved_by", sa.String(36), nullable=True),
        sa.Column("cancel_type", sa.String(20), nullable=False, server_default="single_day"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    # 3. slot_lock
    op.create_table(
        "slot_lock",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("doctor_id", sa.String(36), sa.ForeignKey("doctor.id"), nullable=False, index=True),
        sa.Column("schedule_id", sa.String(36), sa.ForeignKey("doctor_schedule.id"), nullable=True),
        sa.Column("slot_date", sa.Date(), nullable=False),
        sa.Column("slot_time", sa.Time(), nullable=False),
        sa.Column("locked_by", sa.String(36), nullable=False),
        sa.Column("locked_at", sa.DateTime(), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("appointment_id", sa.String(36), nullable=True),
    )

    # 4. schedule_modification
    op.create_table(
        "schedule_modification",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("doctor_id", sa.String(36), sa.ForeignKey("doctor.id"), nullable=False, index=True),
        sa.Column("schedule_id", sa.String(36), sa.ForeignKey("doctor_schedule.id"), nullable=False),
        sa.Column("modification_type", sa.String(50), nullable=False),
        sa.Column("old_value", sa.Text(), nullable=True),
        sa.Column("new_value", sa.Text(), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("approved_by", sa.String(36), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("schedule_modification")
    op.drop_table("slot_lock")
    op.drop_table("doctor_schedule_cancellation")
    op.drop_table("doctor_schedule")
