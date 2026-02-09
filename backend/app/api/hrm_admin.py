"""HRM Payroll Config & Policies router – Patch 4.5

~20 endpoints: policies CRUD, service letters, salary structures,
shift templates, leave types admin, EPF/ETF config, analytics.
"""
from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import select, func
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.api.deps import get_current_user
from app.models.hrm_policy import (
    HRPolicy, HRPolicyCreate, HRPolicyRead,
    ServiceLetterRequest, ServiceLetterRequestCreate, ServiceLetterRequestRead,
)

router = APIRouter()


# ──────────────────── HR Policies ────────────────────

@router.post("/policies", response_model=HRPolicyRead, status_code=201)
async def create_policy(
    body: HRPolicyCreate,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    p = HRPolicy(**body.model_dump())
    session.add(p)
    await session.commit()
    await session.refresh(p)
    return p


@router.get("/policies", response_model=List[HRPolicyRead])
async def list_policies(
    category: Optional[str] = None,
    skip: int = 0, limit: int = 50,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    q = select(HRPolicy).where(HRPolicy.is_active == True)  # noqa
    if category:
        q = q.where(HRPolicy.category == category)
    q = q.order_by(HRPolicy.created_at.desc()).offset(skip).limit(limit)  # type: ignore
    result = await session.exec(q)
    return list(result.all())


@router.get("/policies/{policy_id}", response_model=HRPolicyRead)
async def get_policy(
    policy_id: str,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    p = await session.get(HRPolicy, policy_id)
    if not p:
        raise HTTPException(404, "Policy not found")
    return p


@router.put("/policies/{policy_id}", response_model=HRPolicyRead)
async def update_policy(
    policy_id: str,
    body: HRPolicyCreate,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    p = await session.get(HRPolicy, policy_id)
    if not p:
        raise HTTPException(404, "Policy not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(p, k, v)
    session.add(p)
    await session.commit()
    await session.refresh(p)
    return p


@router.delete("/policies/{policy_id}")
async def delete_policy(
    policy_id: str,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    p = await session.get(HRPolicy, policy_id)
    if not p:
        raise HTTPException(404, "Policy not found")
    p.is_active = False
    session.add(p)
    await session.commit()
    return {"detail": "Policy deactivated"}


# ──────────────────── Service Letter Requests ────────────────────

@router.post("/service-letters", response_model=ServiceLetterRequestRead, status_code=201)
async def request_service_letter(
    body: ServiceLetterRequestCreate,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    data = body.model_dump()
    data["user_id"] = user.id
    sl = ServiceLetterRequest(**data)
    session.add(sl)
    await session.commit()
    await session.refresh(sl)
    return sl


@router.get("/service-letters", response_model=List[ServiceLetterRequestRead])
async def list_service_letters(
    status: Optional[str] = None,
    skip: int = 0, limit: int = 50,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    q = select(ServiceLetterRequest)
    if status:
        q = q.where(ServiceLetterRequest.status == status)
    q = q.order_by(ServiceLetterRequest.created_at.desc()).offset(skip).limit(limit)  # type: ignore
    result = await session.exec(q)
    return list(result.all())


@router.get("/service-letters/my", response_model=List[ServiceLetterRequestRead])
async def my_service_letters(
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    result = await session.exec(
        select(ServiceLetterRequest)
        .where(ServiceLetterRequest.user_id == user.id)
        .order_by(ServiceLetterRequest.created_at.desc())  # type: ignore
    )
    return list(result.all())


@router.put("/service-letters/{sl_id}/approve", response_model=ServiceLetterRequestRead)
async def approve_service_letter(
    sl_id: str,
    content: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    sl = await session.get(ServiceLetterRequest, sl_id)
    if not sl:
        raise HTTPException(404, "Service letter request not found")
    sl.status = "approved"
    sl.approved_by = user.id
    if content:
        sl.content = content
    session.add(sl)
    await session.commit()
    await session.refresh(sl)
    return sl


@router.put("/service-letters/{sl_id}/generate", response_model=ServiceLetterRequestRead)
async def generate_service_letter(
    sl_id: str,
    content: str = Query(...),
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    sl = await session.get(ServiceLetterRequest, sl_id)
    if not sl:
        raise HTTPException(404, "Service letter request not found")
    sl.status = "generated"
    sl.content = content
    session.add(sl)
    await session.commit()
    await session.refresh(sl)
    return sl


# ──────────────────── EPF/ETF Config ────────────────────

@router.get("/config/epf-etf")
async def get_epf_etf_config(
    user=Depends(get_current_user),
):
    """Return default EPF/ETF rates (extendable to DB-backed config)."""
    return {
        "epf_employee_rate": 8.0,
        "epf_employer_rate": 12.0,
        "etf_rate": 3.0,
    }


@router.put("/config/epf-etf")
async def update_epf_etf_config(
    epf_employee_rate: float = Query(8.0),
    epf_employer_rate: float = Query(12.0),
    etf_rate: float = Query(3.0),
    user=Depends(get_current_user),
):
    """Stub — in production, persist to a settings table."""
    return {
        "epf_employee_rate": epf_employee_rate,
        "epf_employer_rate": epf_employer_rate,
        "etf_rate": etf_rate,
        "detail": "Config updated (stub)",
    }


# ──────────────────── Analytics ────────────────────

@router.get("/analytics/staff-summary")
async def staff_summary(
    branch_id: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    from app.models.user import User
    q = select(User.role_as, func.count(User.id)).where(User.is_active == True).group_by(User.role_as)  # noqa
    if branch_id:
        q = q.where(User.branch_id == branch_id)
    result = await session.exec(q)
    role_map = {0: "super_admin", 1: "branch_admin", 2: "doctor", 3: "pharmacist",
                4: "nurse", 5: "receptionist", 6: "cashier", 7: "patient"}
    return [{"role": role_map.get(r[0], str(r[0])), "count": r[1]} for r in result.all()]


@router.get("/analytics/payroll-summary")
async def payroll_summary(
    year: Optional[int] = None,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    from app.models.hrm_salary import SalaryPay
    yr = year or date.today().year
    result = await session.exec(
        select(
            SalaryPay.month,
            func.count(SalaryPay.id).label("count"),
            func.coalesce(func.sum(SalaryPay.gross), 0).label("total_gross"),
            func.coalesce(func.sum(SalaryPay.net), 0).label("total_net"),
        ).where(SalaryPay.year == yr)
        .group_by(SalaryPay.month)
    )
    return [{"month": r[0], "count": r[1], "gross": float(r[2]), "net": float(r[3])} for r in result.all()]


@router.get("/analytics/leave-summary")
async def leave_summary(
    year: Optional[int] = None,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    from app.models.hrm_leave import Leave
    yr = year or date.today().year
    result = await session.exec(
        select(
            Leave.status,
            func.count(Leave.id).label("count"),
        ).where(func.year(Leave.start_date) == yr)
        .group_by(Leave.status)
    )
    return [{"status": r[0], "count": r[1]} for r in result.all()]
