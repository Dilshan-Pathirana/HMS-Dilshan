"""add purchase request tables

Revision ID: 09a1b2c3d4e5
Revises: 08b9c0d1e2f3
Create Date: 2025-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
import sqlmodel

revision = "09a1b2c3d4e5"
down_revision = "08b9c0d1e2f3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "purchase_request",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("branch_id", sa.String(36), nullable=False, index=True),
        sa.Column("requested_by", sa.String(36), nullable=False, index=True),
        sa.Column("supplier_id", sa.String(36), nullable=True),
        sa.Column("status", sa.String(30), nullable=False, server_default="draft"),
        sa.Column("total_amount", sa.Float, nullable=False, server_default="0"),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("approved_by", sa.String(36), nullable=True),
        sa.Column("approved_at", sa.DateTime, nullable=True),
        sa.Column("submitted_at", sa.DateTime, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
        sa.Column("updated_at", sa.DateTime, nullable=False),
    )

    op.create_table(
        "purchase_request_item",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("request_id", sa.String(36), sa.ForeignKey("purchase_request.id"), nullable=False, index=True),
        sa.Column("product_id", sa.String(36), nullable=True),
        sa.Column("product_name", sa.String(200), nullable=True),
        sa.Column("quantity", sa.Integer, nullable=False, server_default="1"),
        sa.Column("unit_price", sa.Float, nullable=False, server_default="0"),
        sa.Column("total", sa.Float, nullable=False, server_default="0"),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )


def downgrade() -> None:
    op.drop_table("purchase_request_item")
    op.drop_table("purchase_request")
