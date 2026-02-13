"""Add height and weight columns to patient table

Revision ID: 20260213_pt_height_weight
Revises: f3d81b71bc5b
Create Date: 2026-02-13
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20260213_pt_height_weight"
down_revision = "f3d81b71bc5b"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("patient", sa.Column("height", sa.Float(), nullable=True))
    op.add_column("patient", sa.Column("weight", sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column("patient", "weight")
    op.drop_column("patient", "height")
