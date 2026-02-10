"""add_fk_check_unique_constraints

Revision ID: c9a0b1c2d3e4
Revises: 6c8d9e0f1a2b
Create Date: 2026-02-10

Adds DB-level constraints to match application expectations:
- Foreign keys for common *_id columns that were previously unconstrained
- CHECK constraints for status/payment enums
- Composite uniqueness for per-branch/per-day configs

"""

from typing import Sequence, Union

from alembic import op  # type: ignore
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c9a0b1c2d3e4"
down_revision: Union[str, None] = "6c8d9e0f1a2b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ───────────────────────── Uniqueness ─────────────────────────
    op.create_unique_constraint("uq_system_settings_key", "system_settings", ["key"])
    op.create_unique_constraint("uq_appointment_settings_branch", "appointment_settings", ["branch_id"])
    op.create_unique_constraint(
        "uq_daily_cash_summary_register_date",
        "daily_cash_summary",
        ["register_id", "summary_date"],
    )
    op.create_unique_constraint(
        "uq_slot_lock_doctor_date_time",
        "slot_lock",
        ["doctor_id", "slot_date", "slot_time"],
    )

    # ───────────────────────── Foreign Keys ─────────────────────────
    # Purchase requests
    op.create_foreign_key(
        "fk_purchase_request_branch",
        "purchase_request",
        "branch",
        ["branch_id"],
        ["id"],
    )
    op.create_foreign_key(
        "fk_purchase_request_requested_by",
        "purchase_request",
        "user",
        ["requested_by"],
        ["id"],
    )
    op.create_foreign_key(
        "fk_purchase_request_supplier",
        "purchase_request",
        "supplier",
        ["supplier_id"],
        ["id"],
    )
    op.create_foreign_key(
        "fk_purchase_request_approved_by",
        "purchase_request",
        "user",
        ["approved_by"],
        ["id"],
    )
    op.create_foreign_key(
        "fk_purchase_request_item_product",
        "purchase_request_item",
        "product",
        ["product_id"],
        ["id"],
    )

    # POS
    op.create_foreign_key(
        "fk_billing_transaction_cashier",
        "billing_transaction",
        "user",
        ["cashier_id"],
        ["id"],
    )
    op.create_foreign_key(
        "fk_transaction_item_product",
        "transaction_item",
        "product",
        ["product_id"],
        ["id"],
    )
    op.create_foreign_key(
        "fk_cash_register_cashier",
        "cash_register",
        "user",
        ["cashier_id"],
        ["id"],
    )
    op.create_foreign_key(
        "fk_eod_report_cashier",
        "eod_report",
        "user",
        ["cashier_id"],
        ["id"],
    )
    op.create_foreign_key(
        "fk_pos_audit_log_user",
        "pos_audit_log",
        "user",
        ["user_id"],
        ["id"],
    )

    # Appointments
    op.create_foreign_key(
        "fk_appointment_cancelled_by",
        "appointment",
        "user",
        ["cancelled_by"],
        ["id"],
    )
    op.create_foreign_key(
        "fk_appointment_audit_log_changed_by",
        "appointment_audit_log",
        "user",
        ["changed_by"],
        ["id"],
    )

    # HRM
    op.create_foreign_key(
        "fk_leave_approved_by",
        "leave",
        "user",
        ["approved_by"],
        ["id"],
    )
    op.create_foreign_key(
        "fk_admin_leave_admin",
        "admin_leave",
        "user",
        ["admin_id"],
        ["id"],
    )

    # Consultation
    op.create_foreign_key(
        "fk_investigation_ordered_by",
        "investigation",
        "user",
        ["ordered_by"],
        ["id"],
    )

    # Doctor schedule
    op.create_foreign_key(
        "fk_doctor_schedule_cancellation_approved_by",
        "doctor_schedule_cancellation",
        "user",
        ["approved_by"],
        ["id"],
    )
    op.create_foreign_key(
        "fk_slot_lock_locked_by",
        "slot_lock",
        "user",
        ["locked_by"],
        ["id"],
    )
    op.create_foreign_key(
        "fk_slot_lock_appointment",
        "slot_lock",
        "appointment",
        ["appointment_id"],
        ["id"],
    )
    op.create_foreign_key(
        "fk_schedule_modification_approved_by",
        "schedule_modification",
        "user",
        ["approved_by"],
        ["id"],
    )

    # Website
    op.create_foreign_key(
        "fk_web_doctor_doctor",
        "web_doctor",
        "doctor",
        ["doctor_id"],
        ["id"],
    )

    # Pharmacy/inventory
    op.create_foreign_key(
        "fk_product_stock_pharmacy",
        "product_stock",
        "pharmacy",
        ["pharmacy_id"],
        ["id"],
    )
    op.create_foreign_key(
        "fk_pharmacy_inventory_pharmacy",
        "pharmacy_inventory",
        "pharmacy",
        ["pharmacy_id"],
        ["id"],
    )
    op.create_foreign_key(
        "fk_inventory_batch_pharmacy",
        "inventory_batch",
        "pharmacy",
        ["pharmacy_id"],
        ["id"],
    )
    op.create_foreign_key(
        "fk_pharmacy_stock_transaction_pharmacy",
        "pharmacy_stock_transaction",
        "pharmacy",
        ["pharmacy_id"],
        ["id"],
    )
    op.create_foreign_key(
        "fk_pharmacy_stock_transaction_performed_by",
        "pharmacy_stock_transaction",
        "user",
        ["performed_by"],
        ["id"],
    )
    op.create_foreign_key(
        "fk_prescription_dispensed_by",
        "prescription",
        "user",
        ["dispensed_by"],
        ["id"],
    )

    # ───────────────────────── CHECK constraints ─────────────────────────
    # NOTE: MySQL enforces CHECK constraints on 8.0.16+. If running older versions,
    # these are parsed but not enforced.
    op.create_check_constraint(
        "ck_appointment_status",
        "appointment",
        "status in ('pending','confirmed','in_progress','completed','cancelled','no_show')",
    )
    op.create_check_constraint(
        "ck_appointment_payment_status",
        "appointment",
        "payment_status in ('unpaid','paid','refunded','partial')",
    )

    op.create_check_constraint(
        "ck_billing_transaction_status",
        "billing_transaction",
        "status in ('pending','completed','refunded','cancelled')",
    )
    op.create_check_constraint(
        "ck_cash_register_status",
        "cash_register",
        "status in ('open','closed')",
    )
    op.create_check_constraint(
        "ck_eod_report_status",
        "eod_report",
        "status in ('draft','submitted','approved')",
    )

    op.create_check_constraint(
        "ck_leave_status",
        "leave",
        "status in ('pending','approved','rejected')",
    )

    op.create_check_constraint(
        "ck_consultation_status",
        "consultation",
        "status in ('in_progress','completed')",
    )

    op.create_check_constraint(
        "ck_doctor_schedule_status",
        "doctor_schedule",
        "status in ('active','inactive')",
    )
    op.create_check_constraint(
        "ck_doctor_schedule_cancellation_status",
        "doctor_schedule_cancellation",
        "status in ('pending','approved','rejected')",
    )
    op.create_check_constraint(
        "ck_schedule_modification_status",
        "schedule_modification",
        "status in ('pending','approved','rejected')",
    )

    op.create_check_constraint(
        "ck_contact_message_status",
        "contact_message",
        "status in ('new','read','responded')",
    )

    op.create_check_constraint(
        "ck_pharmacy_status",
        "pharmacy",
        "status in ('active','inactive')",
    )
    op.create_check_constraint(
        "ck_pharmacy_inventory_status",
        "pharmacy_inventory",
        "status in ('active','inactive')",
    )
    op.create_check_constraint(
        "ck_purchase_request_status",
        "purchase_request",
        "status in ('draft','submitted','approved','rejected','clarification_needed','fulfilled')",
    )
    op.create_check_constraint(
        "ck_prescription_status",
        "prescription",
        "status in ('pending','dispensed','partial')",
    )


def downgrade() -> None:
    # Drop CHECK constraints
    op.drop_constraint("ck_prescription_status", "prescription", type_="check")
    op.drop_constraint("ck_purchase_request_status", "purchase_request", type_="check")
    op.drop_constraint("ck_pharmacy_inventory_status", "pharmacy_inventory", type_="check")
    op.drop_constraint("ck_pharmacy_status", "pharmacy", type_="check")
    op.drop_constraint("ck_contact_message_status", "contact_message", type_="check")
    op.drop_constraint("ck_schedule_modification_status", "schedule_modification", type_="check")
    op.drop_constraint("ck_doctor_schedule_cancellation_status", "doctor_schedule_cancellation", type_="check")
    op.drop_constraint("ck_doctor_schedule_status", "doctor_schedule", type_="check")
    op.drop_constraint("ck_consultation_status", "consultation", type_="check")
    op.drop_constraint("ck_leave_status", "leave", type_="check")
    op.drop_constraint("ck_eod_report_status", "eod_report", type_="check")
    op.drop_constraint("ck_cash_register_status", "cash_register", type_="check")
    op.drop_constraint("ck_billing_transaction_status", "billing_transaction", type_="check")
    op.drop_constraint("ck_appointment_payment_status", "appointment", type_="check")
    op.drop_constraint("ck_appointment_status", "appointment", type_="check")

    # Drop FKs
    op.drop_constraint("fk_prescription_dispensed_by", "prescription", type_="foreignkey")
    op.drop_constraint("fk_pharmacy_stock_transaction_performed_by", "pharmacy_stock_transaction", type_="foreignkey")
    op.drop_constraint("fk_pharmacy_stock_transaction_pharmacy", "pharmacy_stock_transaction", type_="foreignkey")
    op.drop_constraint("fk_inventory_batch_pharmacy", "inventory_batch", type_="foreignkey")
    op.drop_constraint("fk_pharmacy_inventory_pharmacy", "pharmacy_inventory", type_="foreignkey")
    op.drop_constraint("fk_product_stock_pharmacy", "product_stock", type_="foreignkey")

    op.drop_constraint("fk_web_doctor_doctor", "web_doctor", type_="foreignkey")

    op.drop_constraint("fk_schedule_modification_approved_by", "schedule_modification", type_="foreignkey")
    op.drop_constraint("fk_slot_lock_appointment", "slot_lock", type_="foreignkey")
    op.drop_constraint("fk_slot_lock_locked_by", "slot_lock", type_="foreignkey")
    op.drop_constraint("fk_doctor_schedule_cancellation_approved_by", "doctor_schedule_cancellation", type_="foreignkey")

    op.drop_constraint("fk_investigation_ordered_by", "investigation", type_="foreignkey")

    op.drop_constraint("fk_admin_leave_admin", "admin_leave", type_="foreignkey")
    op.drop_constraint("fk_leave_approved_by", "leave", type_="foreignkey")

    op.drop_constraint("fk_appointment_audit_log_changed_by", "appointment_audit_log", type_="foreignkey")
    op.drop_constraint("fk_appointment_cancelled_by", "appointment", type_="foreignkey")

    op.drop_constraint("fk_pos_audit_log_user", "pos_audit_log", type_="foreignkey")
    op.drop_constraint("fk_eod_report_cashier", "eod_report", type_="foreignkey")
    op.drop_constraint("fk_cash_register_cashier", "cash_register", type_="foreignkey")
    op.drop_constraint("fk_transaction_item_product", "transaction_item", type_="foreignkey")
    op.drop_constraint("fk_billing_transaction_cashier", "billing_transaction", type_="foreignkey")

    op.drop_constraint("fk_purchase_request_item_product", "purchase_request_item", type_="foreignkey")
    op.drop_constraint("fk_purchase_request_approved_by", "purchase_request", type_="foreignkey")
    op.drop_constraint("fk_purchase_request_supplier", "purchase_request", type_="foreignkey")
    op.drop_constraint("fk_purchase_request_requested_by", "purchase_request", type_="foreignkey")
    op.drop_constraint("fk_purchase_request_branch", "purchase_request", type_="foreignkey")

    # Drop uniqueness
    op.drop_constraint("uq_slot_lock_doctor_date_time", "slot_lock", type_="unique")
    op.drop_constraint("uq_daily_cash_summary_register_date", "daily_cash_summary", type_="unique")
    op.drop_constraint("uq_appointment_settings_branch", "appointment_settings", type_="unique")
    op.drop_constraint("uq_system_settings_key", "system_settings", type_="unique")
