"""Add HRM leave tables (leave_type, leave, admin_leave)

Revision ID: 05e6f7a8b9c0
Revises: 04d5e6f7a8b9
Create Date: 2025-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "05e6f7a8b9c0"
down_revision = "04d5e6f7a8b9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "leave_type",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("max_days_per_year", sa.Integer(), server_default=sa.text("14")),
        sa.Column("is_paid", sa.Boolean(), server_default=sa.text("1")),
        sa.Column("requires_approval", sa.Boolean(), server_default=sa.text("1")),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "leave",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("user.id"), nullable=False, index=True),
        sa.Column("branch_id", sa.String(36), sa.ForeignKey("branch.id"), nullable=True),
        sa.Column("leave_type_id", sa.String(36), sa.ForeignKey("leave_type.id"), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("status", sa.String(20), server_default=sa.text("'pending'")),
        sa.Column("approved_by", sa.String(36), nullable=True),
        sa.Column("approved_at", sa.DateTime(), nullable=True),
        sa.Column("level", sa.Integer(), server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "admin_leave",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("leave_id", sa.String(36), sa.ForeignKey("leave.id"), nullable=False, index=True),
        sa.Column("admin_id", sa.String(36), nullable=False),
        sa.Column("action", sa.String(20), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("actioned_at", sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("admin_leave")
    op.drop_table("leave")
    op.drop_table("leave_type")
