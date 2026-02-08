"""Add doctor availability and slot lock

Revision ID: b3e6f2c1a0d1
Revises: 52a1b9c3d4e8
Create Date: 2026-02-08

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b3e6f2c1a0d1"
down_revision: Union[str, None] = "52a1b9c3d4e8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # New availability table (per-date windows)
    op.create_table(
        "doctor_availability",
        sa.Column("doctor_id", sa.String(length=36), nullable=False),
        sa.Column("branch_id", sa.String(length=36), nullable=False),
        sa.Column("specialisation", sa.String(length=255), nullable=False),
        sa.Column("availability_date", sa.Date(), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.Column("slot_minutes", sa.Integer(), nullable=False, server_default="30"),
        sa.Column("is_blocked", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.ForeignKeyConstraint(["branch_id"], ["branch.id"]),
        sa.ForeignKeyConstraint(["doctor_id"], ["doctor.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    # Visitor booking support: patient fields optional
    op.alter_column("patient", "date_of_birth", existing_type=sa.Date(), nullable=True)
    op.alter_column("patient", "gender", existing_type=sa.String(length=255), nullable=True)
    op.alter_column(
        "patient",
        "contact_number",
        existing_type=sa.String(length=255),
        nullable=True,
    )

    # Slot lock to prevent double booking (doctor+branch+date+time)
    op.create_unique_constraint(
        "uq_appointment_slot",
        "appointment",
        ["doctor_id", "branch_id", "appointment_date", "appointment_time"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_appointment_slot", "appointment", type_="unique")
    op.alter_column("patient", "contact_number", existing_type=sa.String(length=255), nullable=False)
    op.alter_column("patient", "gender", existing_type=sa.String(length=255), nullable=False)
    op.alter_column("patient", "date_of_birth", existing_type=sa.Date(), nullable=False)
    op.drop_table("doctor_availability")
