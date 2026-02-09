"""HRM Leave router – Patch 4.2

~15 endpoints: leave types, apply, approve/reject, balance, history.
"""
from __future__ import annotations

from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import select, func
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.api.deps import get_current_user
from app.models.hrm_leave import (
    LeaveType, LeaveTypeCreate, LeaveTypeRead,
    Leave, LeaveCreate, LeaveRead,
    AdminLeave, AdminLeaveCreate, AdminLeaveRead,
)

router = APIRouter()


# ──────────────────── Leave Types ────────────────────

@router.get("/leave-types", response_model=List[LeaveTypeRead])
async def list_leave_types(
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    result = await session.exec(select(LeaveType).where(LeaveType.is_active == True))  # noqa
    return list(result.all())


@router.post("/leave-types", response_model=LeaveTypeRead, status_code=201)
async def create_leave_type(
    body: LeaveTypeCreate,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    lt = LeaveType(**body.model_dump())
    session.add(lt)
    await session.commit()
    await session.refresh(lt)
    return lt


@router.put("/leave-types/{lt_id}", response_model=LeaveTypeRead)
async def update_leave_type(
    lt_id: str, body: LeaveTypeCreate,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    lt = await session.get(LeaveType, lt_id)
    if not lt:
        raise HTTPException(404, "Leave type not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(lt, k, v)
    session.add(lt)
    await session.commit()
    await session.refresh(lt)
    return lt


@router.delete("/leave-types/{lt_id}")
async def delete_leave_type(
    lt_id: str,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    lt = await session.get(LeaveType, lt_id)
    if not lt:
        raise HTTPException(404, "Leave type not found")
    lt.is_active = False
    session.add(lt)
    await session.commit()
    return {"detail": "Leave type deactivated"}


# ──────────────────── Leave Applications ────────────────────

@router.post("/leaves", response_model=LeaveRead, status_code=201)
async def apply_leave(
    body: LeaveCreate,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    data = body.model_dump()
    data["user_id"] = user.id
    data["branch_id"] = getattr(user, "branch_id", None)
    leave = Leave(**data)
    session.add(leave)
    await session.commit()
    await session.refresh(leave)
    return leave


@router.get("/leaves/my", response_model=List[LeaveRead])
async def my_leaves(
    status: Optional[str] = None,
    skip: int = 0, limit: int = 50,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    q = select(Leave).where(Leave.user_id == user.id)
    if status:
        q = q.where(Leave.status == status)
    q = q.order_by(Leave.created_at.desc()).offset(skip).limit(limit)  # type: ignore
    result = await session.exec(q)
    return list(result.all())


@router.get("/leaves/requests", response_model=List[LeaveRead])
async def leave_requests(
    branch_id: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0, limit: int = 50,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    """List leave requests (admin/manager view)."""
    q = select(Leave)
    if branch_id:
        q = q.where(Leave.branch_id == branch_id)
    if status:
        q = q.where(Leave.status == status)
    q = q.order_by(Leave.created_at.desc()).offset(skip).limit(limit)  # type: ignore
    result = await session.exec(q)
    return list(result.all())


@router.get("/leaves/{leave_id}", response_model=LeaveRead)
async def get_leave(
    leave_id: str,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    l = await session.get(Leave, leave_id)
    if not l:
        raise HTTPException(404, "Leave not found")
    return l


@router.put("/leaves/{leave_id}/approve", response_model=LeaveRead)
async def approve_leave(
    leave_id: str,
    notes: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    from datetime import datetime
    l = await session.get(Leave, leave_id)
    if not l:
        raise HTTPException(404, "Leave not found")
    l.status = "approved"
    l.approved_by = user.id
    l.approved_at = datetime.utcnow()
    session.add(l)
    al = AdminLeave(leave_id=leave_id, admin_id=user.id, action="approved", notes=notes)
    session.add(al)
    await session.commit()
    await session.refresh(l)
    return l


@router.put("/leaves/{leave_id}/reject", response_model=LeaveRead)
async def reject_leave(
    leave_id: str,
    notes: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    from datetime import datetime
    l = await session.get(Leave, leave_id)
    if not l:
        raise HTTPException(404, "Leave not found")
    l.status = "rejected"
    l.approved_by = user.id
    l.approved_at = datetime.utcnow()
    session.add(l)
    al = AdminLeave(leave_id=leave_id, admin_id=user.id, action="rejected", notes=notes)
    session.add(al)
    await session.commit()
    await session.refresh(l)
    return l


@router.get("/leaves/balance/{user_id}")
async def leave_balance(
    user_id: str,
    year: int = Query(default=None),
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    """Get leave balance for a user."""
    yr = year or date.today().year
    types_res = await session.exec(select(LeaveType).where(LeaveType.is_active == True))  # noqa
    types = list(types_res.all())
    balances = []
    for lt in types:
        used_res = await session.exec(
            select(func.count(Leave.id)).where(
                Leave.user_id == user_id,
                Leave.leave_type_id == lt.id,
                Leave.status == "approved",
                func.year(Leave.start_date) == yr,
            )
        )
        used = used_res.one() or 0
        balances.append({
            "leave_type": lt.name,
            "leave_type_id": lt.id,
            "max_days": lt.max_days_per_year,
            "used": used,
            "remaining": lt.max_days_per_year - used,
        })
    return balances


@router.get("/leaves/history/{user_id}", response_model=List[LeaveRead])
async def leave_history(
    user_id: str,
    skip: int = 0, limit: int = 50,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    result = await session.exec(
        select(Leave).where(Leave.user_id == user_id)
        .order_by(Leave.created_at.desc())  # type: ignore
        .offset(skip).limit(limit)
    )
    return list(result.all())
