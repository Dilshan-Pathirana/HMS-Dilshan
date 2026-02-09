"""Add POS tables (billing_transaction, transaction_item, cash_register, cash_entry, daily_cash_summary, eod_report, pos_audit_log)

Revision ID: 04d5e6f7a8b9
Revises: 03c4d5e6f7a8
Create Date: 2025-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "04d5e6f7a8b9"
down_revision = "03c4d5e6f7a8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "billing_transaction",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("branch_id", sa.String(36), sa.ForeignKey("branch.id"), nullable=False, index=True),
        sa.Column("patient_id", sa.String(36), sa.ForeignKey("patient.id"), nullable=True, index=True),
        sa.Column("cashier_id", sa.String(36), nullable=False, index=True),
        sa.Column("transaction_type", sa.String(30), nullable=False),
        sa.Column("total_amount", sa.Float(), server_default=sa.text("0")),
        sa.Column("discount_amount", sa.Float(), server_default=sa.text("0")),
        sa.Column("net_amount", sa.Float(), server_default=sa.text("0")),
        sa.Column("payment_method", sa.String(30), nullable=True),
        sa.Column("status", sa.String(20), server_default=sa.text("'pending'")),
        sa.Column("invoice_number", sa.String(50), nullable=True, index=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )

    op.create_table(
        "transaction_item",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("transaction_id", sa.String(36), sa.ForeignKey("billing_transaction.id"), nullable=False, index=True),
        sa.Column("product_id", sa.String(36), nullable=True),
        sa.Column("description", sa.String(255), nullable=False),
        sa.Column("quantity", sa.Integer(), server_default=sa.text("1")),
        sa.Column("unit_price", sa.Float(), server_default=sa.text("0")),
        sa.Column("discount", sa.Float(), server_default=sa.text("0")),
        sa.Column("total", sa.Float(), server_default=sa.text("0")),
    )

    op.create_table(
        "cash_register",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("branch_id", sa.String(36), sa.ForeignKey("branch.id"), nullable=False, index=True),
        sa.Column("cashier_id", sa.String(36), nullable=False, index=True),
        sa.Column("opening_balance", sa.Float(), server_default=sa.text("0")),
        sa.Column("closing_balance", sa.Float(), nullable=True),
        sa.Column("status", sa.String(20), server_default=sa.text("'open'")),
        sa.Column("opened_at", sa.DateTime(), nullable=False),
        sa.Column("closed_at", sa.DateTime(), nullable=True),
    )

    op.create_table(
        "cash_entry",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("register_id", sa.String(36), sa.ForeignKey("cash_register.id"), nullable=False, index=True),
        sa.Column("entry_type", sa.String(20), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("reference", sa.String(100), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "daily_cash_summary",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("register_id", sa.String(36), sa.ForeignKey("cash_register.id"), nullable=False, index=True),
        sa.Column("summary_date", sa.Date(), nullable=False),
        sa.Column("total_sales", sa.Float(), server_default=sa.text("0")),
        sa.Column("total_refunds", sa.Float(), server_default=sa.text("0")),
        sa.Column("total_adjustments", sa.Float(), server_default=sa.text("0")),
        sa.Column("expected_balance", sa.Float(), server_default=sa.text("0")),
        sa.Column("actual_balance", sa.Float(), nullable=True),
        sa.Column("discrepancy", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "eod_report",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("branch_id", sa.String(36), sa.ForeignKey("branch.id"), nullable=False, index=True),
        sa.Column("cashier_id", sa.String(36), nullable=False),
        sa.Column("report_date", sa.Date(), nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("status", sa.String(20), server_default=sa.text("'draft'")),
        sa.Column("submitted_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "pos_audit_log",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), nullable=False, index=True),
        sa.Column("action", sa.String(50), nullable=False),
        sa.Column("entity", sa.String(50), nullable=False),
        sa.Column("entity_id", sa.String(36), nullable=True),
        sa.Column("details", sa.Text(), nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("pos_audit_log")
    op.drop_table("eod_report")
    op.drop_table("daily_cash_summary")
    op.drop_table("cash_entry")
    op.drop_table("cash_register")
    op.drop_table("transaction_item")
    op.drop_table("billing_transaction")
