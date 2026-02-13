"""merge heads fix

Revision ID: 20260213_merge_heads_fix
Revises: 20260213_add_patient_height_weight, 6c8d9e0f1a2b
Create Date: 2026-02-13 18:55:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '20260213_merge_heads_fix'
down_revision: Union[str, None] = ('20260213_add_patient_height_weight', '6c8d9e0f1a2b', 'f1a2b3c4d5e6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
