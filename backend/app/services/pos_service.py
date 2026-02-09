"""POS / Billing service – Patch 4.1

Invoice generation, cash reconciliation, EOD workflow.
"""
from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional
import json
import uuid

from fastapi import HTTPException
from sqlmodel import select, func
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.pos import (
    BillingTransaction,
    TransactionItem,
    CashRegister,
    CashEntry,
    DailyCashSummary,
    EODReport,
    POSAuditLog,
)


class POSService:
    """Billing, cash register, EOD operations."""

    # ---- Billing Transactions ----

    @staticmethod
    async def create_transaction(session: AsyncSession, data: dict,
                                 items: List[dict] | None = None) -> BillingTransaction:
        inv = f"INV-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        data["invoice_number"] = inv
        txn = BillingTransaction(**data)
        session.add(txn)
        await session.flush()

        if items:
            for it in items:
                it["transaction_id"] = txn.id
                it["total"] = it.get("quantity", 1) * it.get("unit_price", 0) - it.get("discount", 0)
                session.add(TransactionItem(**it))

        await session.commit()
        await session.refresh(txn)
        return txn

    @staticmethod
    async def list_transactions(session: AsyncSession, branch_id: Optional[str] = None,
                                from_date: Optional[date] = None, to_date: Optional[date] = None,
                                status: Optional[str] = None,
                                skip: int = 0, limit: int = 50):
        q = select(BillingTransaction)
        if branch_id:
            q = q.where(BillingTransaction.branch_id == branch_id)
        if from_date:
            q = q.where(func.date(BillingTransaction.created_at) >= from_date)
        if to_date:
            q = q.where(func.date(BillingTransaction.created_at) <= to_date)
        if status:
            q = q.where(BillingTransaction.status == status)
        q = q.order_by(BillingTransaction.created_at.desc()).offset(skip).limit(limit)  # type: ignore
        result = await session.exec(q)
        return list(result.all())

    @staticmethod
    async def get_transaction(session: AsyncSession, txn_id: str):
        t = await session.get(BillingTransaction, txn_id)
        if not t:
            raise HTTPException(404, "Transaction not found")
        items_res = await session.exec(
            select(TransactionItem).where(TransactionItem.transaction_id == txn_id)
        )
        return {"transaction": t, "items": list(items_res.all())}

    @staticmethod
    async def refund_transaction(session: AsyncSession, txn_id: str, performed_by: str):
        t = await session.get(BillingTransaction, txn_id)
        if not t:
            raise HTTPException(404, "Transaction not found")
        if t.status == "refunded":
            raise HTTPException(400, "Already refunded")
        t.status = "refunded"
        t.updated_at = datetime.utcnow()
        session.add(t)
        await session.commit()
        await session.refresh(t)
        return t

    # ---- Cash Register ----

    @staticmethod
    async def open_register(session: AsyncSession, data: dict) -> CashRegister:
        reg = CashRegister(**data)
        session.add(reg)
        await session.commit()
        await session.refresh(reg)
        return reg

    @staticmethod
    async def close_register(session: AsyncSession, register_id: str,
                             closing_balance: float) -> CashRegister:
        reg = await session.get(CashRegister, register_id)
        if not reg:
            raise HTTPException(404, "Register not found")
        reg.status = "closed"
        reg.closing_balance = closing_balance
        reg.closed_at = datetime.utcnow()
        session.add(reg)
        await session.commit()
        await session.refresh(reg)
        return reg

    @staticmethod
    async def add_cash_entry(session: AsyncSession, data: dict) -> CashEntry:
        entry = CashEntry(**data)
        session.add(entry)
        await session.commit()
        await session.refresh(entry)
        return entry

    @staticmethod
    async def list_cash_entries(session: AsyncSession, register_id: str,
                                skip: int = 0, limit: int = 50):
        result = await session.exec(
            select(CashEntry)
            .where(CashEntry.register_id == register_id)
            .order_by(CashEntry.created_at.desc())  # type: ignore
            .offset(skip).limit(limit)
        )
        return list(result.all())

    # ---- Cash Summary ----

    @staticmethod
    async def generate_daily_summary(session: AsyncSession, register_id: str,
                                     summary_date: date) -> DailyCashSummary:
        entries_res = await session.exec(
            select(CashEntry).where(
                CashEntry.register_id == register_id,
                func.date(CashEntry.created_at) == summary_date,
            )
        )
        entries = list(entries_res.all())
        sales = sum(e.amount for e in entries if e.entry_type == "sale")
        refunds = sum(abs(e.amount) for e in entries if e.entry_type == "refund")
        adjustments = sum(e.amount for e in entries if e.entry_type == "adjustment")
        expected = sales - refunds + adjustments

        summary = DailyCashSummary(
            register_id=register_id,
            summary_date=summary_date,
            total_sales=sales,
            total_refunds=refunds,
            total_adjustments=adjustments,
            expected_balance=expected,
        )
        session.add(summary)
        await session.commit()
        await session.refresh(summary)
        return summary

    # ---- EOD Reports ----

    @staticmethod
    async def submit_eod(session: AsyncSession, data: dict) -> EODReport:
        data["status"] = "submitted"
        data["submitted_at"] = datetime.utcnow()
        report = EODReport(**data)
        session.add(report)
        await session.commit()
        await session.refresh(report)
        return report

    @staticmethod
    async def list_eod_reports(session: AsyncSession, branch_id: Optional[str] = None,
                               status: Optional[str] = None,
                               skip: int = 0, limit: int = 50):
        q = select(EODReport)
        if branch_id:
            q = q.where(EODReport.branch_id == branch_id)
        if status:
            q = q.where(EODReport.status == status)
        q = q.order_by(EODReport.created_at.desc()).offset(skip).limit(limit)  # type: ignore
        result = await session.exec(q)
        return list(result.all())

    @staticmethod
    async def approve_eod(session: AsyncSession, report_id: str) -> EODReport:
        r = await session.get(EODReport, report_id)
        if not r:
            raise HTTPException(404, "EOD report not found")
        r.status = "approved"
        session.add(r)
        await session.commit()
        await session.refresh(r)
        return r

    # ---- Dashboard Stats ----

    @staticmethod
    async def dashboard_stats(session: AsyncSession, branch_id: Optional[str] = None,
                              cashier_id: Optional[str] = None):
        q_base = select(func.count(BillingTransaction.id))
        q_revenue = select(func.coalesce(func.sum(BillingTransaction.net_amount), 0))
        filters = [BillingTransaction.status == "completed"]
        if branch_id:
            filters.append(BillingTransaction.branch_id == branch_id)
        if cashier_id:
            filters.append(BillingTransaction.cashier_id == cashier_id)

        today_filters = filters + [func.date(BillingTransaction.created_at) == date.today()]

        total_txns = await session.exec(q_base.where(*filters))
        today_txns = await session.exec(q_base.where(*today_filters))
        total_revenue = await session.exec(q_revenue.where(*filters))
        today_revenue = await session.exec(q_revenue.where(*today_filters))

        pending = await session.exec(
            select(func.count(BillingTransaction.id))
            .where(BillingTransaction.status == "pending")
        )
        return {
            "totalTransactions": total_txns.one() or 0,
            "todayTransactions": today_txns.one() or 0,
            "totalRevenue": float(total_revenue.one() or 0),
            "todayRevenue": float(today_revenue.one() or 0),
            "pendingTransactions": pending.one() or 0,
        }

    # ---- Audit ----

    @staticmethod
    async def log_action(session: AsyncSession, user_id: str, action: str,
                         entity: str, entity_id: Optional[str] = None,
                         details: Optional[dict] = None, ip: Optional[str] = None):
        log = POSAuditLog(
            user_id=user_id, action=action, entity=entity,
            entity_id=entity_id,
            details=json.dumps(details) if details else None,
            ip_address=ip,
        )
        session.add(log)
        await session.commit()

    @staticmethod
    async def list_audit_logs(session: AsyncSession, skip: int = 0, limit: int = 50):
        result = await session.exec(
            select(POSAuditLog)
            .order_by(POSAuditLog.created_at.desc())  # type: ignore
            .offset(skip).limit(limit)
        )
        return list(result.all())
