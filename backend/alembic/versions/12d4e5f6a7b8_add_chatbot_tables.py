"""add chatbot tables

Revision ID: 12d4e5f6a7b8
Revises: 11c3d4e5f6a7
Create Date: 2025-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "12d4e5f6a7b8"
down_revision = "11c3d4e5f6a7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "chatbot_faq",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("question", sa.String(1000), nullable=False),
        sa.Column("answer", sa.Text, nullable=False),
        sa.Column("category", sa.String(100), nullable=True),
        sa.Column("language", sa.String(10), nullable=False, server_default="en"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime, nullable=False),
        sa.Column("updated_at", sa.DateTime, nullable=False),
    )

    op.create_table(
        "chatbot_log",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("session_id", sa.String(36), nullable=False, index=True),
        sa.Column("question", sa.String(2000), nullable=False),
        sa.Column("response", sa.Text, nullable=True),
        sa.Column("was_helpful", sa.Boolean, nullable=True),
        sa.Column("language", sa.String(10), nullable=False, server_default="en"),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )


def downgrade() -> None:
    op.drop_table("chatbot_log")
    op.drop_table("chatbot_faq")
