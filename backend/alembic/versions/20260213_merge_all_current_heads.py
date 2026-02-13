"""merge all current heads

Revision ID: 20260213_merge_all_current_heads
Revises: 20260213_merge_heads_fix, a7b8c9d0e1f2
Create Date: 2026-02-13 20:30:00.000000

"""
from typing import Sequence, Union


# revision identifiers, used by Alembic.
revision: str = "20260213_merge_all_current_heads"
down_revision: Union[str, None] = ("20260213_merge_heads_fix", "a7b8c9d0e1f2")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
