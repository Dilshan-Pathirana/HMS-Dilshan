"""add chatbot tables

Revision ID: 12d4e5f6a7b8
Revises: 11c3d4e5f6a7
Create Date: 2025-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '12d4e5f6a7b8'
down_revision = '11c3d4e5f6a7'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Chatbot FAQ
    op.create_table('chatbot_faq',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('question', sa.String(length=1000), nullable=False),
        sa.Column('answer', sa.Text(), nullable=False),
        sa.Column('question_si', sa.String(length=1000), nullable=True),
        sa.Column('answer_si', sa.Text(), nullable=True),
        sa.Column('category', sa.String(length=100), nullable=True),
        sa.Column('language', sa.String(length=10), nullable=False, server_default='en'),
        sa.Column('keywords', sa.Text(), nullable=True),
        sa.Column('priority', sa.Integer(), nullable=False, server_default='50'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # Chatbot Log
    op.create_table('chatbot_log',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('session_id', sa.String(length=36), nullable=False),
        sa.Column('question', sa.String(length=2000), nullable=False),
        sa.Column('response', sa.Text(), nullable=True),
        sa.Column('category_detected', sa.String(length=100), nullable=True),
        sa.Column('was_helpful', sa.Boolean(), nullable=True),
        sa.Column('language', sa.String(length=10), nullable=False, server_default='en'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_chatbot_log_session_id'), 'chatbot_log', ['session_id'], unique=False)

    # Chatbot Disease Mapping
    op.create_table('chatbot_disease_mapping',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('disease_name', sa.String(length=255), nullable=False),
        sa.Column('specialization', sa.String(length=255), nullable=False),
        sa.Column('safe_response', sa.Text(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade() -> None:
    op.drop_table('chatbot_disease_mapping')
    op.drop_index(op.f('ix_chatbot_log_session_id'), table_name='chatbot_log')
    op.drop_table('chatbot_log')
    op.drop_table('chatbot_faq')
