"""Add pharmacy inventory tables (product, supplier, product_stock, pharmacy_inventory, inventory_batch, pharmacy_stock_transaction, daily_purchase_product, prescription)

Revision ID: a1b2c3d4e5f6_pi
Revises: f6a7b8c9d0e1
Create Date: 2025-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = "01a2b3c4d5e6"
down_revision = "f6a7b8c9d0e1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- product ---
    op.create_table(
        "product",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False, index=True),
        sa.Column("generic_name", sa.String(255), nullable=True),
        sa.Column("category", sa.String(100), nullable=True),
        sa.Column("unit", sa.String(50), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("supplier_id", sa.String(36), nullable=True),
        sa.Column("requires_prescription", sa.Boolean(), server_default=sa.text("0")),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    # --- supplier ---
    op.create_table(
        "supplier",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("contact_person", sa.String(255), nullable=True),
        sa.Column("phone", sa.String(50), nullable=True),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("payment_terms", sa.String(100), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    # FK: product.supplier_id -> supplier.id  (deferred after both tables exist)
    op.create_foreign_key("fk_product_supplier", "product", "supplier", ["supplier_id"], ["id"])

    # --- product_stock ---
    op.create_table(
        "product_stock",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("product_id", sa.String(36), sa.ForeignKey("product.id"), nullable=False, index=True),
        sa.Column("branch_id", sa.String(36), sa.ForeignKey("branch.id"), nullable=False, index=True),
        sa.Column("pharmacy_id", sa.String(36), nullable=True),
        sa.Column("quantity", sa.Integer(), server_default=sa.text("0")),
        sa.Column("batch_number", sa.String(100), nullable=True),
        sa.Column("expiry_date", sa.Date(), nullable=True),
        sa.Column("purchase_price", sa.Float(), nullable=True),
        sa.Column("selling_price", sa.Float(), nullable=True),
        sa.Column("reorder_level", sa.Integer(), server_default=sa.text("10")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )

    # --- pharmacy_inventory ---
    op.create_table(
        "pharmacy_inventory",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("pharmacy_id", sa.String(36), nullable=True),
        sa.Column("product_id", sa.String(36), sa.ForeignKey("product.id"), nullable=False, index=True),
        sa.Column("quantity", sa.Integer(), server_default=sa.text("0")),
        sa.Column("batch_no", sa.String(100), nullable=True),
        sa.Column("expiry_date", sa.Date(), nullable=True),
        sa.Column("purchase_price", sa.Float(), nullable=True),
        sa.Column("selling_price", sa.Float(), nullable=True),
        sa.Column("status", sa.String(20), server_default=sa.text("'active'")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    # --- inventory_batch ---
    op.create_table(
        "inventory_batch",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("product_id", sa.String(36), sa.ForeignKey("product.id"), nullable=False, index=True),
        sa.Column("pharmacy_id", sa.String(36), nullable=True),
        sa.Column("batch_no", sa.String(100), nullable=False),
        sa.Column("received_date", sa.Date(), nullable=False),
        sa.Column("expiry_date", sa.Date(), nullable=True),
        sa.Column("quantity_received", sa.Integer(), nullable=False),
        sa.Column("quantity_remaining", sa.Integer(), nullable=False),
        sa.Column("cost_price", sa.Float(), nullable=True),
        sa.Column("supplier_id", sa.String(36), sa.ForeignKey("supplier.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    # --- pharmacy_stock_transaction ---
    op.create_table(
        "pharmacy_stock_transaction",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("pharmacy_id", sa.String(36), nullable=True),
        sa.Column("product_id", sa.String(36), sa.ForeignKey("product.id"), nullable=False, index=True),
        sa.Column("transaction_type", sa.String(30), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("reference_id", sa.String(36), nullable=True),
        sa.Column("performed_by", sa.String(36), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    # --- daily_purchase_product ---
    op.create_table(
        "daily_purchase_product",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("product_id", sa.String(36), sa.ForeignKey("product.id"), nullable=False, index=True),
        sa.Column("supplier_id", sa.String(36), sa.ForeignKey("supplier.id"), nullable=True),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_price", sa.Float(), nullable=False),
        sa.Column("total", sa.Float(), nullable=False),
        sa.Column("purchase_date", sa.Date(), nullable=False),
        sa.Column("invoice_no", sa.String(100), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    # --- prescription ---
    op.create_table(
        "prescription",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("consultation_id", sa.String(36), sa.ForeignKey("consultation.id"), nullable=True, index=True),
        sa.Column("patient_id", sa.String(36), sa.ForeignKey("patient.id"), nullable=False, index=True),
        sa.Column("doctor_id", sa.String(36), sa.ForeignKey("doctor.id"), nullable=False),
        sa.Column("items", sa.Text(), nullable=True),
        sa.Column("status", sa.String(20), server_default=sa.text("'pending'")),
        sa.Column("dispensed_by", sa.String(36), nullable=True),
        sa.Column("dispensed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("prescription")
    op.drop_table("daily_purchase_product")
    op.drop_table("pharmacy_stock_transaction")
    op.drop_table("inventory_batch")
    op.drop_table("pharmacy_inventory")
    op.drop_table("product_stock")
    op.drop_constraint("fk_product_supplier", "product", type_="foreignkey")
    op.drop_table("supplier")
    op.drop_table("product")
