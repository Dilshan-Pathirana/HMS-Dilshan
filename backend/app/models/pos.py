"""POS / Cashier Billing models – Patch 4.1

Tables: billing_transaction, transaction_item, cash_register,
        cash_entry, daily_cash_summary, eod_report, pos_audit_log
"""
from __future__ import annotations

from datetime import date, datetime
from typing import Optional
from uuid import uuid4

from sqlmodel import Field, SQLModel, Column
from sqlalchemy import Text


# ---------- BillingTransaction ----------

class BillingTransactionBase(SQLModel):
    branch_id: str = Field(foreign_key="branch.id", max_length=36, index=True)
    patient_id: Optional[str] = Field(default=None, foreign_key="patient.id", max_length=36, index=True)
    cashier_id: str = Field(max_length=36, index=True)
    transaction_type: str = Field(max_length=30)  # consultation/pharmacy/lab/other
    total_amount: float = Field(default=0)
    discount_amount: float = Field(default=0)
    net_amount: float = Field(default=0)
    payment_method: Optional[str] = Field(default=None, max_length=30)  # cash/card/insurance
    status: str = Field(default="pending", max_length=20)  # pending/completed/refunded/cancelled
    invoice_number: Optional[str] = Field(default=None, max_length=50, index=True)
    notes: Optional[str] = Field(default=None, sa_column=Column(Text))


class BillingTransaction(BillingTransactionBase, table=True):
    __tablename__ = "billing_transaction"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None


class BillingTransactionCreate(BillingTransactionBase):
    pass


class BillingTransactionRead(BillingTransactionBase):
    id: str
    created_at: datetime


# ---------- TransactionItem ----------

class TransactionItemBase(SQLModel):
    transaction_id: str = Field(foreign_key="billing_transaction.id", max_length=36, index=True)
    product_id: Optional[str] = Field(default=None, max_length=36)
    description: str = Field(max_length=255)
    quantity: int = Field(default=1)
    unit_price: float = Field(default=0)
    discount: float = Field(default=0)
    total: float = Field(default=0)


class TransactionItem(TransactionItemBase, table=True):
    __tablename__ = "transaction_item"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)


class TransactionItemCreate(TransactionItemBase):
    pass


class TransactionItemRead(TransactionItemBase):
    id: str


# ---------- CashRegister ----------

class CashRegisterBase(SQLModel):
    branch_id: str = Field(foreign_key="branch.id", max_length=36, index=True)
    cashier_id: str = Field(max_length=36, index=True)
    opening_balance: float = Field(default=0)
    closing_balance: Optional[float] = None
    status: str = Field(default="open", max_length=20)  # open/closed


class CashRegister(CashRegisterBase, table=True):
    __tablename__ = "cash_register"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    opened_at: datetime = Field(default_factory=datetime.utcnow)
    closed_at: Optional[datetime] = None


class CashRegisterCreate(CashRegisterBase):
    pass


class CashRegisterRead(CashRegisterBase):
    id: str
    opened_at: datetime
    closed_at: Optional[datetime]


# ---------- CashEntry ----------

class CashEntryBase(SQLModel):
    register_id: str = Field(foreign_key="cash_register.id", max_length=36, index=True)
    entry_type: str = Field(max_length=20)  # sale/refund/adjustment
    amount: float
    reference: Optional[str] = Field(default=None, max_length=100)
    notes: Optional[str] = Field(default=None, sa_column=Column(Text))


class CashEntry(CashEntryBase, table=True):
    __tablename__ = "cash_entry"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class CashEntryCreate(CashEntryBase):
    pass


class CashEntryRead(CashEntryBase):
    id: str
    created_at: datetime


# ---------- DailyCashSummary ----------

class DailyCashSummaryBase(SQLModel):
    register_id: str = Field(foreign_key="cash_register.id", max_length=36, index=True)
    summary_date: date
    total_sales: float = Field(default=0)
    total_refunds: float = Field(default=0)
    total_adjustments: float = Field(default=0)
    expected_balance: float = Field(default=0)
    actual_balance: Optional[float] = None
    discrepancy: Optional[float] = None


class DailyCashSummary(DailyCashSummaryBase, table=True):
    __tablename__ = "daily_cash_summary"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class DailyCashSummaryCreate(DailyCashSummaryBase):
    pass


class DailyCashSummaryRead(DailyCashSummaryBase):
    id: str
    created_at: datetime


# ---------- EODReport ----------

class EODReportBase(SQLModel):
    branch_id: str = Field(foreign_key="branch.id", max_length=36, index=True)
    cashier_id: str = Field(max_length=36)
    report_date: date
    summary: Optional[str] = Field(default=None, sa_column=Column(Text))  # JSON
    status: str = Field(default="draft", max_length=20)  # draft/submitted/approved
    submitted_at: Optional[datetime] = None


class EODReport(EODReportBase, table=True):
    __tablename__ = "eod_report"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class EODReportCreate(EODReportBase):
    pass


class EODReportRead(EODReportBase):
    id: str
    created_at: datetime


# ---------- POSAuditLog ----------

class POSAuditLogBase(SQLModel):
    user_id: str = Field(max_length=36, index=True)
    action: str = Field(max_length=50)
    entity: str = Field(max_length=50)
    entity_id: Optional[str] = Field(default=None, max_length=36)
    details: Optional[str] = Field(default=None, sa_column=Column(Text))  # JSON
    ip_address: Optional[str] = Field(default=None, max_length=45)


class POSAuditLog(POSAuditLogBase, table=True):
    __tablename__ = "pos_audit_log"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class POSAuditLogCreate(POSAuditLogBase):
    pass


class POSAuditLogRead(POSAuditLogBase):
    id: str
    created_at: datetime
