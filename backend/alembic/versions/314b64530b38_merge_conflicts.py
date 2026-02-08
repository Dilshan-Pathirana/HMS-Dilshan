"""merge_conflicts

Revision ID: 314b64530b38
Revises: 09a69e1e22ef, a703e2c7b5b1
Create Date: 2026-02-08 08:11:11.311074

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '314b64530b38'
down_revision: Union[str, None] = ('09a69e1e22ef', 'a703e2c7b5b1')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
