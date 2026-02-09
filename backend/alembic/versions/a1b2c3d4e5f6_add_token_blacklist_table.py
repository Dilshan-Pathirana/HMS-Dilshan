"""add_token_blacklist_table

Revision ID: a1b2c3d4e5f6
Revises: 68b82ca50374
Create Date: 2026-02-09 12:55:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '68b82ca50374'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Patch 1.1: Create token_blacklist table for auth logout/token rotation
    op.create_table(
        'token_blacklist',
        sa.Column('id', sa.String(36), primary_key=True, nullable=False),
        sa.Column('token_jti', sa.String(64), nullable=False, index=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('user.id'), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('token_blacklist')
