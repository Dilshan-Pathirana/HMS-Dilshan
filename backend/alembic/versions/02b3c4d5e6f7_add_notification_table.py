"""Add notification table

Revision ID: 02b3c4d5e6f7
Revises: 01a2b3c4d5e6
Create Date: 2025-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "02b3c4d5e6f7"
down_revision = "01a2b3c4d5e6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "notification",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("user.id"), nullable=False, index=True),
        sa.Column("role", sa.String(30), nullable=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("type", sa.String(30), server_default=sa.text("'info'")),
        sa.Column("is_read", sa.Boolean(), server_default=sa.text("0")),
        sa.Column("data", sa.Text(), nullable=True),
        sa.Column("link", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("read_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("notification")
