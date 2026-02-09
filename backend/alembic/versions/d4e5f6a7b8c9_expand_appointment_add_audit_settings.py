"""expand appointment and add audit/settings tables

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2025-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "d4e5f6a7b8c9"
down_revision = "c3d4e5f6a7b8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Expand appointment table with new columns
    op.add_column("appointment", sa.Column("verification_code", sa.String(10), nullable=True))
    op.add_column("appointment", sa.Column("payment_status", sa.String(20), server_default="unpaid", nullable=True))
    op.add_column("appointment", sa.Column("payment_amount", sa.Float(), nullable=True))
    op.add_column("appointment", sa.Column("payment_method", sa.String(50), nullable=True))
    op.add_column("appointment", sa.Column("payment_reference", sa.String(100), nullable=True))
    op.add_column("appointment", sa.Column("cancellation_reason", sa.Text(), nullable=True))
    op.add_column("appointment", sa.Column("cancelled_by", sa.String(36), nullable=True))
    op.add_column("appointment", sa.Column("check_in_time", sa.DateTime(), nullable=True))
    op.add_column("appointment", sa.Column("consultation_start", sa.DateTime(), nullable=True))
    op.add_column("appointment", sa.Column("consultation_end", sa.DateTime(), nullable=True))
    op.add_column("appointment", sa.Column("is_walk_in", sa.Boolean(), server_default="0", nullable=False))
    op.add_column("appointment", sa.Column("queue_number", sa.Integer(), nullable=True))

    # 2. appointment_audit_log
    op.create_table(
        "appointment_audit_log",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("appointment_id", sa.String(36), sa.ForeignKey("appointment.id"), nullable=False, index=True),
        sa.Column("action", sa.String(50), nullable=False),
        sa.Column("changed_by", sa.String(36), nullable=False),
        sa.Column("old_data", sa.Text(), nullable=True),
        sa.Column("new_data", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    # 3. appointment_settings
    op.create_table(
        "appointment_settings",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("branch_id", sa.String(36), sa.ForeignKey("branch.id"), nullable=False, index=True),
        sa.Column("max_daily_appointments", sa.Integer(), nullable=False, server_default="50"),
        sa.Column("slot_duration", sa.Integer(), nullable=False, server_default="30"),
        sa.Column("booking_advance_days", sa.Integer(), nullable=False, server_default="30"),
        sa.Column("cancellation_deadline_hours", sa.Integer(), nullable=False, server_default="24"),
        sa.Column("payment_required", sa.Boolean(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("appointment_settings")
    op.drop_table("appointment_audit_log")
    op.drop_column("appointment", "queue_number")
    op.drop_column("appointment", "is_walk_in")
    op.drop_column("appointment", "consultation_end")
    op.drop_column("appointment", "consultation_start")
    op.drop_column("appointment", "check_in_time")
    op.drop_column("appointment", "cancelled_by")
    op.drop_column("appointment", "cancellation_reason")
    op.drop_column("appointment", "payment_reference")
    op.drop_column("appointment", "payment_method")
    op.drop_column("appointment", "payment_amount")
    op.drop_column("appointment", "payment_status")
    op.drop_column("appointment", "verification_code")
