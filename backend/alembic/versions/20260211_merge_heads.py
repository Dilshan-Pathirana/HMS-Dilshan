"""Alembic merge migration to resolve multiple heads.

Revision ID: f3d81b71bc5b
Revises: 15a1b2c3d4e5, c9a0b1c2d3e4
Create Date: 2026-02-11
"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f3d81b71bc5b"
down_revision: Union[str, None] = ("15a1b2c3d4e5", "c9a0b1c2d3e4")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
