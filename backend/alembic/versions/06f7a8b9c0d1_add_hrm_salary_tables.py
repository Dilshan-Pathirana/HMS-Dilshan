"""Add HRM salary tables (staff_salary, salary_pay, employee_ot)

Revision ID: 06f7a8b9c0d1
Revises: 05e6f7a8b9c0
Create Date: 2025-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "06f7a8b9c0d1"
down_revision = "05e6f7a8b9c0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "staff_salary",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("user.id"), nullable=False, index=True),
        sa.Column("basic_salary", sa.Float(), server_default=sa.text("0")),
        sa.Column("allowances", sa.Text(), nullable=True),
        sa.Column("deductions", sa.Text(), nullable=True),
        sa.Column("epf_rate", sa.Float(), server_default=sa.text("8.0")),
        sa.Column("etf_rate", sa.Float(), server_default=sa.text("3.0")),
        sa.Column("effective_from", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "salary_pay",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("salary_id", sa.String(36), sa.ForeignKey("staff_salary.id"), nullable=False, index=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("user.id"), nullable=False, index=True),
        sa.Column("month", sa.Integer(), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("gross", sa.Float(), server_default=sa.text("0")),
        sa.Column("deductions_total", sa.Float(), server_default=sa.text("0")),
        sa.Column("net", sa.Float(), server_default=sa.text("0")),
        sa.Column("status", sa.String(20), server_default=sa.text("'pending'")),
        sa.Column("paid_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "employee_ot",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("user.id"), nullable=False, index=True),
        sa.Column("ot_date", sa.Date(), nullable=False),
        sa.Column("hours", sa.Float(), nullable=False),
        sa.Column("rate_multiplier", sa.Float(), server_default=sa.text("1.5")),
        sa.Column("approved_by", sa.String(36), nullable=True),
        sa.Column("status", sa.String(20), server_default=sa.text("'pending'")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("employee_ot")
    op.drop_table("salary_pay")
    op.drop_table("staff_salary")
