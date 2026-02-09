"""add medical insights tables

Revision ID: 10b2c3d4e5f6
Revises: 09a1b2c3d4e5
Create Date: 2025-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "10b2c3d4e5f6"
down_revision = "09a1b2c3d4e5"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "medical_post",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("doctor_id", sa.String(36), nullable=False, index=True),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("slug", sa.String(350), nullable=False, index=True),
        sa.Column("content", sa.Text, nullable=True),
        sa.Column("summary", sa.String(500), nullable=True),
        sa.Column("category", sa.String(100), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="draft"),
        sa.Column("likes_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("rating_avg", sa.Float, nullable=False, server_default="0"),
        sa.Column("published_at", sa.DateTime, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
        sa.Column("updated_at", sa.DateTime, nullable=False),
    )

    op.create_table(
        "post_comment",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("post_id", sa.String(36), sa.ForeignKey("medical_post.id"), nullable=False, index=True),
        sa.Column("user_id", sa.String(36), nullable=False, index=True),
        sa.Column("content", sa.String(2000), nullable=False),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )

    op.create_table(
        "question_answer",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("post_id", sa.String(36), sa.ForeignKey("medical_post.id"), nullable=True, index=True),
        sa.Column("asked_by", sa.String(36), nullable=False, index=True),
        sa.Column("question_text", sa.String(2000), nullable=False),
        sa.Column("answer_text", sa.String(5000), nullable=True),
        sa.Column("answered_by", sa.String(36), nullable=True),
        sa.Column("is_answered", sa.Boolean, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )


def downgrade() -> None:
    op.drop_table("question_answer")
    op.drop_table("post_comment")
    op.drop_table("medical_post")
