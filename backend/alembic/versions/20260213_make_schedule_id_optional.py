"""make schedule_id optional in schedule_modification

Revision ID: 20260213_make_schedule_id_optional
Revises: 20260213_merge_heads_fix
Create Date: 2026-02-13 22:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '20260213_make_schedule_id_optional'
down_revision: Union[str, None] = '20260213_merge_heads_fix'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # make schedule_id nullable
    op.alter_column('schedule_modification', 'schedule_id',
               existing_type=sa.VARCHAR(length=36),
               nullable=True)


def downgrade() -> None:
    # make schedule_id not nullable
    op.alter_column('schedule_modification', 'schedule_id',
               existing_type=sa.VARCHAR(length=36),
               nullable=False)
