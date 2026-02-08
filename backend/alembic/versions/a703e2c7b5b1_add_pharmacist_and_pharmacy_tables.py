"""Add pharmacist and pharmacy tables

Revision ID: a703e2c7b5b1
Revises: f9c28b357a2c
Create Date: 2026-02-07 23:55:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
import sqlmodel

# revision identifiers, used by Alembic.
revision: str = 'a703e2c7b5b1'
down_revision: Union[str, None] = 'f9c28b357a2c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Create pharmacy table
    op.create_table('pharmacy',
        sa.Column('name', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('pharmacy_code', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('license_number', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('license_expiry_date', sa.Date(), nullable=True),
        sa.Column('location', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('phone', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('email', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('status', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('branch_id', sa.String(length=36), nullable=True),
        sa.Column('pharmacist_id', sa.String(length=36), nullable=True),
        sa.Column('id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['branch_id'], ['branch.id'], ),
        sa.ForeignKeyConstraint(['pharmacist_id'], ['user.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('pharmacist_id')
    )
    op.create_index(op.f('ix_pharmacy_name'), 'pharmacy', ['name'], unique=False)
    op.create_index(op.f('ix_pharmacy_pharmacy_code'), 'pharmacy', ['pharmacy_code'], unique=True)

    # 2. Create pharmacist table
    op.create_table('pharmacist',
        sa.Column('first_name', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('last_name', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('date_of_birth', sa.Date(), nullable=True),
        sa.Column('gender', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('nic_number', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('contact_number_mobile', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('contact_number_landline', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('home_address', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('emergency_contact_info', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('pharmacist_registration_number', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('work_experience', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('years_of_experience', sa.Integer(), nullable=True),
        sa.Column('previous_employment', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('license_validity_date', sa.Date(), nullable=True),
        sa.Column('qualifications', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('joining_date', sa.Date(), nullable=True),
        sa.Column('contract_type', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('contract_duration', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('probation_start_date', sa.Date(), nullable=True),
        sa.Column('probation_end_date', sa.Date(), nullable=True),
        sa.Column('basic_salary', sa.Float(), nullable=True),
        sa.Column('compensation_package', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('photo_path', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('nic_photo_path', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('branch_id', sa.String(length=36), nullable=False),
        sa.ForeignKeyConstraint(['branch_id'], ['branch.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )

def downgrade() -> None:
    op.drop_table('pharmacist')
    op.drop_index(op.f('ix_pharmacy_pharmacy_code'), table_name='pharmacy')
    op.drop_index(op.f('ix_pharmacy_name'), table_name='pharmacy')
    op.drop_table('pharmacy')
