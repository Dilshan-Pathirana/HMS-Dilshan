"""Add HRM policy tables (hr_policy, service_letter_request)

Revision ID: 08b9c0d1e2f3
Revises: 07a8b9c0d1e2
Create Date: 2025-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "08b9c0d1e2f3"
down_revision = "07a8b9c0d1e2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "hr_policy",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("category", sa.String(50), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("1")),
        sa.Column("effective_from", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "service_letter_request",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("user.id"), nullable=False, index=True),
        sa.Column("purpose", sa.Text(), nullable=True),
        sa.Column("status", sa.String(20), server_default=sa.text("'pending'")),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("approved_by", sa.String(36), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("service_letter_request")
    op.drop_table("hr_policy")
