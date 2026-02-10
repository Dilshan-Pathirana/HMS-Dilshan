"""Doctor-Branch many-to-many relationship.

Revision ID: e1b2c3d4f5a6
Revises: f3d81b71bc5b
Create Date: 2026-02-11
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "e1b2c3d4f5a6"
down_revision: Union[str, None] = "f3d81b71bc5b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create doctor_branch_link table if it does not exist
    if not sa.inspect(op.get_bind()).has_table("doctorbranchlink"):
        op.create_table(
            "doctorbranchlink",
            sa.Column("doctor_id", sa.String(length=36), sa.ForeignKey("doctor.id", ondelete="CASCADE"), primary_key=True),
            sa.Column("branch_id", sa.String(length=36), sa.ForeignKey("branch.id", ondelete="CASCADE"), primary_key=True),
        )

    # Migrate existing doctor.branch_id data to doctor_branch_link (if present)
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col["name"] for col in inspector.get_columns("doctor")]
    if "branch_id" in columns:
        doctor_rows = conn.execute(sa.text("SELECT id, branch_id FROM doctor")).fetchall()
        for row in doctor_rows:
            if row.branch_id:
                conn.execute(
                    sa.text(
                        "INSERT INTO doctorbranchlink (doctor_id, branch_id) VALUES (:doctor_id, :branch_id)"
                    ),
                    {"doctor_id": row.id, "branch_id": row.branch_id},
                )

        # Drop FK on doctor.branch_id if present before dropping column
        fk_name = conn.execute(
            sa.text(
                """
                SELECT CONSTRAINT_NAME
                FROM information_schema.KEY_COLUMN_USAGE
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'doctor'
                  AND COLUMN_NAME = 'branch_id'
                  AND REFERENCED_TABLE_NAME IS NOT NULL
                """
            )
        ).scalar()
        if fk_name:
            op.execute(sa.text(f"ALTER TABLE doctor DROP FOREIGN KEY `{fk_name}`"))

        # Remove branch_id from doctor
        with op.batch_alter_table("doctor") as batch_op:
            batch_op.drop_column("branch_id")


def downgrade() -> None:
    # Add branch_id back to doctor
    with op.batch_alter_table("doctor") as batch_op:
        batch_op.add_column(sa.Column("branch_id", sa.String(length=36), sa.ForeignKey("branch.id")))

    # Drop doctor_branch_link table
    op.drop_table("doctorbranchlink")
