"""POS / Cashier router – Patch 4.1

~25 endpoints: billing, cash register, EOD, dashboard, audit.
"""
from __future__ import annotations

from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.api.deps import get_current_user
from app.models.pos import (
    BillingTransactionCreate, BillingTransactionRead,
    TransactionItemCreate, TransactionItemRead,
    CashRegisterCreate, CashRegisterRead,
    CashEntryCreate, CashEntryRead,
    DailyCashSummaryRead,
    EODReportCreate, EODReportRead,
    POSAuditLogRead,
)
from app.services.pos_service import POSService

router = APIRouter()
svc = POSService


# ── helper schema ──
class CreateTransactionBody(BaseModel):
    transaction: BillingTransactionCreate
    items: List[TransactionItemCreate] = []


# ──────────────────── Dashboard ────────────────────

@router.get("/dashboard-stats")
async def pos_dashboard(
    branch_id: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    return await svc.dashboard_stats(session, branch_id, user.id)


# ──────────────────── Transactions ────────────────────

@router.post("/transactions", response_model=BillingTransactionRead, status_code=201)
async def create_transaction(
    body: CreateTransactionBody,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    data = body.transaction.model_dump()
    data["cashier_id"] = user.id
    items = [i.model_dump() for i in body.items]
    return await svc.create_transaction(session, data, items)


@router.get("/transactions", response_model=List[BillingTransactionRead])
async def list_transactions(
    branch_id: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    status: Optional[str] = None,
    skip: int = 0, limit: int = 50,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    return await svc.list_transactions(session, branch_id, from_date, to_date, status, skip, limit)


@router.get("/transactions/{txn_id}")
async def get_transaction(
    txn_id: str,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    return await svc.get_transaction(session, txn_id)


@router.post("/transactions/{txn_id}/refund", response_model=BillingTransactionRead)
async def refund_transaction(
    txn_id: str,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    return await svc.refund_transaction(session, txn_id, user.id)


@router.get("/sales-report")
async def sales_report(
    branch_id: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    from sqlmodel import select, func
    from app.models.pos import BillingTransaction
    q = select(
        func.date(BillingTransaction.created_at).label("day"),
        func.count(BillingTransaction.id).label("count"),
        func.coalesce(func.sum(BillingTransaction.net_amount), 0).label("revenue"),
    ).where(BillingTransaction.status == "completed")
    if branch_id:
        q = q.where(BillingTransaction.branch_id == branch_id)
    if from_date:
        q = q.where(func.date(BillingTransaction.created_at) >= from_date)
    if to_date:
        q = q.where(func.date(BillingTransaction.created_at) <= to_date)
    q = q.group_by(func.date(BillingTransaction.created_at))
    result = await session.exec(q)
    return [{"date": str(r[0]), "count": r[1], "revenue": float(r[2])} for r in result.all()]


@router.get("/daily-trends")
async def daily_trends(
    branch_id: Optional[str] = None,
    days: int = 7,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    from datetime import timedelta
    from sqlmodel import select, func
    from app.models.pos import BillingTransaction
    cutoff = date.today() - timedelta(days=days)
    q = select(
        func.date(BillingTransaction.created_at).label("day"),
        func.count(BillingTransaction.id).label("count"),
        func.coalesce(func.sum(BillingTransaction.net_amount), 0).label("revenue"),
    ).where(
        BillingTransaction.status == "completed",
        func.date(BillingTransaction.created_at) >= cutoff,
    )
    if branch_id:
        q = q.where(BillingTransaction.branch_id == branch_id)
    q = q.group_by(func.date(BillingTransaction.created_at))
    result = await session.exec(q)
    return [{"date": str(r[0]), "count": r[1], "revenue": float(r[2])} for r in result.all()]


# ──────────────────── Cash Register ────────────────────

@router.post("/registers", response_model=CashRegisterRead, status_code=201)
async def open_register(
    body: CashRegisterCreate,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    data = body.model_dump()
    data["cashier_id"] = user.id
    return await svc.open_register(session, data)


@router.put("/registers/{register_id}/close", response_model=CashRegisterRead)
async def close_register(
    register_id: str,
    closing_balance: float = Query(...),
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    return await svc.close_register(session, register_id, closing_balance)


@router.get("/registers")
async def list_registers(
    branch_id: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0, limit: int = 50,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    from sqlmodel import select
    from app.models.pos import CashRegister
    q = select(CashRegister)
    if branch_id:
        q = q.where(CashRegister.branch_id == branch_id)
    if status:
        q = q.where(CashRegister.status == status)
    q = q.order_by(CashRegister.opened_at.desc()).offset(skip).limit(limit)  # type: ignore
    result = await session.exec(q)
    return list(result.all())


# ──────────────────── Cash Entries ────────────────────

@router.post("/cash-entries", response_model=CashEntryRead, status_code=201)
async def add_cash_entry(
    body: CashEntryCreate,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    return await svc.add_cash_entry(session, body.model_dump())


@router.get("/cash-entries/{register_id}", response_model=List[CashEntryRead])
async def list_cash_entries(
    register_id: str,
    skip: int = 0, limit: int = 50,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    return await svc.list_cash_entries(session, register_id, skip, limit)


# ──────────────────── Cash Summary ────────────────────

@router.post("/cash-summary/{register_id}", response_model=DailyCashSummaryRead)
async def generate_cash_summary(
    register_id: str,
    summary_date: date = Query(default=None),
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    d = summary_date or date.today()
    return await svc.generate_daily_summary(session, register_id, d)


# ──────────────────── EOD Reports ────────────────────

@router.post("/eod-reports", response_model=EODReportRead, status_code=201)
async def submit_eod(
    body: EODReportCreate,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    data = body.model_dump()
    data["cashier_id"] = user.id
    return await svc.submit_eod(session, data)


@router.get("/eod-reports", response_model=List[EODReportRead])
async def list_eod_reports(
    branch_id: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0, limit: int = 50,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    return await svc.list_eod_reports(session, branch_id, status, skip, limit)


@router.get("/eod-reports/{report_id}", response_model=EODReportRead)
async def get_eod_report(
    report_id: str,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    from app.models.pos import EODReport
    r = await session.get(EODReport, report_id)
    if not r:
        raise HTTPException(404, "EOD report not found")
    return r


@router.put("/eod-reports/{report_id}/approve", response_model=EODReportRead)
async def approve_eod(
    report_id: str,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    return await svc.approve_eod(session, report_id)


# ──────────────────── Audit Logs ────────────────────

@router.get("/audit-logs", response_model=List[POSAuditLogRead])
async def list_audit_logs(
    skip: int = 0, limit: int = 50,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    return await svc.list_audit_logs(session, skip, limit)
