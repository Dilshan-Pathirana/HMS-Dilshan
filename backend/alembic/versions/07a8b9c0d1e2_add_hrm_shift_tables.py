"""Add HRM shift tables (employee_shift, attendance, bank_detail)

Revision ID: 07a8b9c0d1e2
Revises: 06f7a8b9c0d1
Create Date: 2025-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "07a8b9c0d1e2"
down_revision = "06f7a8b9c0d1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "employee_shift",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("user.id"), nullable=False, index=True),
        sa.Column("branch_id", sa.String(36), sa.ForeignKey("branch.id"), nullable=True),
        sa.Column("shift_date", sa.Date(), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.Column("shift_type", sa.String(20), nullable=False),
        sa.Column("status", sa.String(20), server_default=sa.text("'scheduled'")),
        sa.Column("acknowledged_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "attendance",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("user.id"), nullable=False, index=True),
        sa.Column("attendance_date", sa.Date(), nullable=False),
        sa.Column("check_in", sa.DateTime(), nullable=True),
        sa.Column("check_out", sa.DateTime(), nullable=True),
        sa.Column("status", sa.String(20), server_default=sa.text("'present'")),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "bank_detail",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("user.id"), nullable=False, index=True),
        sa.Column("bank_name", sa.String(100), nullable=False),
        sa.Column("branch_name", sa.String(100), nullable=True),
        sa.Column("account_number", sa.String(50), nullable=False),
        sa.Column("account_type", sa.String(30), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("bank_detail")
    op.drop_table("attendance")
    op.drop_table("employee_shift")
