"""add_change_log_table

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-02-09 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Patch 1.2: Create change_log table for audit trail
    op.create_table(
        'change_log',
        sa.Column('id', sa.String(36), primary_key=True, nullable=False),
        sa.Column('user_id', sa.String(36), nullable=True),
        sa.Column('action', sa.String(20), nullable=False),
        sa.Column('model_name', sa.String(100), nullable=False, index=True),
        sa.Column('record_id', sa.String(36), nullable=True),
        sa.Column('before_data', sa.Text(), nullable=True),
        sa.Column('after_data', sa.Text(), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('change_log')
