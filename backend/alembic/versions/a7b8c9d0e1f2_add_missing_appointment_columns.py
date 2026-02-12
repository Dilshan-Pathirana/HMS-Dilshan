"""add missing appointment columns (reschedule_count, original_appointment_date, nurse_assessment_status)

Revision ID: a7b8c9d0e1f2
Revises: e1b2c3d4f5a6
Create Date: 2026-02-13
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a7b8c9d0e1f2"
down_revision: Union[str, None] = "e1b2c3d4f5a6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add columns that the Appointment model expects but are missing from the DB
    op.add_column("appointment", sa.Column("reschedule_count", sa.Integer(), server_default="0", nullable=False))
    op.add_column("appointment", sa.Column("original_appointment_date", sa.DateTime(), nullable=True))
    op.add_column("appointment", sa.Column("nurse_assessment_status", sa.String(20), nullable=True))


def downgrade() -> None:
    op.drop_column("appointment", "nurse_assessment_status")
    op.drop_column("appointment", "original_appointment_date")
    op.drop_column("appointment", "reschedule_count")
