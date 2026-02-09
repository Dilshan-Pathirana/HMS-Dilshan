"""HRM Salary & Payroll router – Patch 4.3

~12 endpoints: salary CRUD, payroll, OT, payslips.
"""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import select, func
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.api.deps import get_current_user
from app.models.hrm_salary import (
    StaffSalary, StaffSalaryCreate, StaffSalaryRead,
    SalaryPay, SalaryPayCreate, SalaryPayRead,
    EmployeeOT, EmployeeOTCreate, EmployeeOTRead,
)

router = APIRouter()


# ──────────────────── Salary Structures ────────────────────

@router.post("/salaries", response_model=StaffSalaryRead, status_code=201)
async def create_salary(
    body: StaffSalaryCreate,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    s = StaffSalary(**body.model_dump())
    session.add(s)
    await session.commit()
    await session.refresh(s)
    return s


@router.get("/salaries", response_model=List[StaffSalaryRead])
async def list_salaries(
    user_id: Optional[str] = None,
    skip: int = 0, limit: int = 50,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    q = select(StaffSalary)
    if user_id:
        q = q.where(StaffSalary.user_id == user_id)
    q = q.order_by(StaffSalary.effective_from.desc()).offset(skip).limit(limit)  # type: ignore
    result = await session.exec(q)
    return list(result.all())


@router.get("/salaries/{salary_id}", response_model=StaffSalaryRead)
async def get_salary(
    salary_id: str,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    s = await session.get(StaffSalary, salary_id)
    if not s:
        raise HTTPException(404, "Salary record not found")
    return s


@router.put("/salaries/{salary_id}", response_model=StaffSalaryRead)
async def update_salary(
    salary_id: str,
    body: StaffSalaryCreate,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    s = await session.get(StaffSalary, salary_id)
    if not s:
        raise HTTPException(404, "Salary record not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(s, k, v)
    session.add(s)
    await session.commit()
    await session.refresh(s)
    return s


# ──────────────────── Payroll ────────────────────

@router.post("/payroll/generate", response_model=SalaryPayRead, status_code=201)
async def generate_payroll(
    body: SalaryPayCreate,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    pay = SalaryPay(**body.model_dump())
    session.add(pay)
    await session.commit()
    await session.refresh(pay)
    return pay


@router.get("/payroll", response_model=List[SalaryPayRead])
async def list_payroll(
    user_id: Optional[str] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    skip: int = 0, limit: int = 50,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    q = select(SalaryPay)
    if user_id:
        q = q.where(SalaryPay.user_id == user_id)
    if month:
        q = q.where(SalaryPay.month == month)
    if year:
        q = q.where(SalaryPay.year == year)
    q = q.order_by(SalaryPay.created_at.desc()).offset(skip).limit(limit)  # type: ignore
    result = await session.exec(q)
    return list(result.all())


@router.put("/payroll/{pay_id}/mark-paid", response_model=SalaryPayRead)
async def mark_paid(
    pay_id: str,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    pay = await session.get(SalaryPay, pay_id)
    if not pay:
        raise HTTPException(404, "Payroll record not found")
    pay.status = "paid"
    pay.paid_at = datetime.utcnow()
    session.add(pay)
    await session.commit()
    await session.refresh(pay)
    return pay


@router.get("/payslip/{user_id}", response_model=List[SalaryPayRead])
async def user_payslips(
    user_id: str,
    year: Optional[int] = None,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    q = select(SalaryPay).where(SalaryPay.user_id == user_id)
    if year:
        q = q.where(SalaryPay.year == year)
    q = q.order_by(SalaryPay.year.desc(), SalaryPay.month.desc())  # type: ignore
    result = await session.exec(q)
    return list(result.all())


# ──────────────────── Overtime ────────────────────

@router.post("/overtime", response_model=EmployeeOTRead, status_code=201)
async def record_ot(
    body: EmployeeOTCreate,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    ot = EmployeeOT(**body.model_dump())
    session.add(ot)
    await session.commit()
    await session.refresh(ot)
    return ot


@router.get("/overtime", response_model=List[EmployeeOTRead])
async def list_ot(
    user_id: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0, limit: int = 50,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    q = select(EmployeeOT)
    if user_id:
        q = q.where(EmployeeOT.user_id == user_id)
    if status:
        q = q.where(EmployeeOT.status == status)
    q = q.order_by(EmployeeOT.ot_date.desc()).offset(skip).limit(limit)  # type: ignore
    result = await session.exec(q)
    return list(result.all())


@router.put("/overtime/{ot_id}/approve", response_model=EmployeeOTRead)
async def approve_ot(
    ot_id: str,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    ot = await session.get(EmployeeOT, ot_id)
    if not ot:
        raise HTTPException(404, "OT record not found")
    ot.status = "approved"
    ot.approved_by = user.id
    session.add(ot)
    await session.commit()
    await session.refresh(ot)
    return ot
