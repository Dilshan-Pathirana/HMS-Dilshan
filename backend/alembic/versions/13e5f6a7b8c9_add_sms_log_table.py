"""add sms_log table

Revision ID: 13e5f6a7b8c9
Revises: 12d4e5f6a7b8
Create Date: 2025-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "13e5f6a7b8c9"
down_revision = "12d4e5f6a7b8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "sms_log",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("recipient", sa.String(20), nullable=False),
        sa.Column("message", sa.Text, nullable=False),
        sa.Column("template_type", sa.String(50), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("provider_response", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )


def downgrade() -> None:
    op.drop_table("sms_log")
