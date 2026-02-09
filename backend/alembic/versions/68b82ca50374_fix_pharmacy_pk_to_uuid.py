"""fix_pharmacy_pk_to_uuid

Revision ID: 68b82ca50374
Revises: f247d5b39bf5
Create Date: 2026-02-09 12:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel

# revision identifiers, used by Alembic.
revision: str = '68b82ca50374'
down_revision: Union[str, None] = 'f247d5b39bf5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Patch 0.4: Change pharmacy.id from INTEGER (auto-increment) to VARCHAR(36) UUID
    # Table is empty so no data migration needed
    op.alter_column('pharmacy', 'id',
               existing_type=sa.Integer(),
               type_=sa.String(36),
               existing_nullable=False,
               autoincrement=False)


def downgrade() -> None:
    op.alter_column('pharmacy', 'id',
               existing_type=sa.String(36),
               type_=sa.Integer(),
               existing_nullable=False,
               autoincrement=True)
