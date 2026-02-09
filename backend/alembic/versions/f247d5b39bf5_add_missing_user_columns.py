"""add_missing_user_columns

Revision ID: f247d5b39bf5
Revises: b3e6f2c1a0d1
Create Date: 2026-02-09 12:38:21.684590

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel

# revision identifiers, used by Alembic.
revision: str = 'f247d5b39bf5'
down_revision: Union[str, None] = 'b3e6f2c1a0d1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Patch 0.1: Add 23 missing columns to user table (staff.py / nurse.py depend on these)
    op.add_column('user', sa.Column('first_name', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('user', sa.Column('last_name', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('user', sa.Column('date_of_birth', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('user', sa.Column('gender', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('user', sa.Column('nic_number', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('user', sa.Column('contact_number_mobile', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('user', sa.Column('contact_number_landline', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('user', sa.Column('home_address', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('user', sa.Column('emergency_contact_info', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('user', sa.Column('qualifications', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('user', sa.Column('years_of_experience', sa.Integer(), nullable=True))
    op.add_column('user', sa.Column('medical_registration_number', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('user', sa.Column('license_validity_date', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('user', sa.Column('joining_date', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('user', sa.Column('employee_id', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('user', sa.Column('contract_type', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('user', sa.Column('contract_duration', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('user', sa.Column('probation_start_date', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('user', sa.Column('probation_end_date', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('user', sa.Column('basic_salary', sa.Float(), nullable=True))
    op.add_column('user', sa.Column('compensation_package', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('user', sa.Column('photo_path', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('user', sa.Column('nic_photo_path', sqlmodel.sql.sqltypes.AutoString(), nullable=True))


def downgrade() -> None:
    op.drop_column('user', 'nic_photo_path')
    op.drop_column('user', 'photo_path')
    op.drop_column('user', 'compensation_package')
    op.drop_column('user', 'basic_salary')
    op.drop_column('user', 'probation_end_date')
    op.drop_column('user', 'probation_start_date')
    op.drop_column('user', 'contract_duration')
    op.drop_column('user', 'contract_type')
    op.drop_column('user', 'employee_id')
    op.drop_column('user', 'joining_date')
    op.drop_column('user', 'license_validity_date')
    op.drop_column('user', 'medical_registration_number')
    op.drop_column('user', 'years_of_experience')
    op.drop_column('user', 'qualifications')
    op.drop_column('user', 'emergency_contact_info')
    op.drop_column('user', 'home_address')
    op.drop_column('user', 'contact_number_landline')
    op.drop_column('user', 'contact_number_mobile')
    op.drop_column('user', 'nic_number')
    op.drop_column('user', 'gender')
    op.drop_column('user', 'date_of_birth')
    op.drop_column('user', 'last_name')
    op.drop_column('user', 'first_name')
