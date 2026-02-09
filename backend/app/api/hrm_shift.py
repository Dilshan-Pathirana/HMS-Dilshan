"""HRM Shifts & Attendance router – Patch 4.4

~16 endpoints: shifts, attendance, bank details, colleagues.
"""
from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.api.deps import get_current_user
from app.models.hrm_shift import (
    EmployeeShift, EmployeeShiftCreate, EmployeeShiftRead,
    Attendance, AttendanceCreate, AttendanceRead,
    BankDetail, BankDetailCreate, BankDetailRead,
)

router = APIRouter()


# ──────────────────── Shifts ────────────────────

@router.post("/shifts", response_model=EmployeeShiftRead, status_code=201)
async def create_shift(
    body: EmployeeShiftCreate,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    s = EmployeeShift(**body.model_dump())
    session.add(s)
    await session.commit()
    await session.refresh(s)
    return s


@router.get("/shifts", response_model=List[EmployeeShiftRead])
async def list_shifts(
    user_id: Optional[str] = None,
    branch_id: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    skip: int = 0, limit: int = 50,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    q = select(EmployeeShift)
    if user_id:
        q = q.where(EmployeeShift.user_id == user_id)
    if branch_id:
        q = q.where(EmployeeShift.branch_id == branch_id)
    if from_date:
        q = q.where(EmployeeShift.shift_date >= from_date)
    if to_date:
        q = q.where(EmployeeShift.shift_date <= to_date)
    q = q.order_by(EmployeeShift.shift_date.desc()).offset(skip).limit(limit)  # type: ignore
    result = await session.exec(q)
    return list(result.all())


@router.get("/shifts/my", response_model=List[EmployeeShiftRead])
async def my_shifts(
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    skip: int = 0, limit: int = 50,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    q = select(EmployeeShift).where(EmployeeShift.user_id == user.id)
    if from_date:
        q = q.where(EmployeeShift.shift_date >= from_date)
    if to_date:
        q = q.where(EmployeeShift.shift_date <= to_date)
    q = q.order_by(EmployeeShift.shift_date.desc()).offset(skip).limit(limit)  # type: ignore
    result = await session.exec(q)
    return list(result.all())


@router.put("/shifts/{shift_id}", response_model=EmployeeShiftRead)
async def update_shift(
    shift_id: str,
    body: EmployeeShiftCreate,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    s = await session.get(EmployeeShift, shift_id)
    if not s:
        raise HTTPException(404, "Shift not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(s, k, v)
    session.add(s)
    await session.commit()
    await session.refresh(s)
    return s


@router.delete("/shifts/{shift_id}")
async def delete_shift(
    shift_id: str,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    s = await session.get(EmployeeShift, shift_id)
    if not s:
        raise HTTPException(404, "Shift not found")
    await session.delete(s)
    await session.commit()
    return {"detail": "Shift deleted"}


@router.put("/shifts/{shift_id}/acknowledge", response_model=EmployeeShiftRead)
async def acknowledge_shift(
    shift_id: str,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    s = await session.get(EmployeeShift, shift_id)
    if not s:
        raise HTTPException(404, "Shift not found")
    s.status = "acknowledged"
    s.acknowledged_at = datetime.utcnow()
    session.add(s)
    await session.commit()
    await session.refresh(s)
    return s


# ──────────────────── Attendance ────────────────────

@router.post("/attendance", response_model=AttendanceRead, status_code=201)
async def record_attendance(
    body: AttendanceCreate,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    a = Attendance(**body.model_dump())
    session.add(a)
    await session.commit()
    await session.refresh(a)
    return a


@router.get("/attendance", response_model=List[AttendanceRead])
async def list_attendance(
    user_id: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    skip: int = 0, limit: int = 50,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    q = select(Attendance)
    if user_id:
        q = q.where(Attendance.user_id == user_id)
    if from_date:
        q = q.where(Attendance.attendance_date >= from_date)
    if to_date:
        q = q.where(Attendance.attendance_date <= to_date)
    q = q.order_by(Attendance.attendance_date.desc()).offset(skip).limit(limit)  # type: ignore
    result = await session.exec(q)
    return list(result.all())


@router.get("/attendance/my", response_model=List[AttendanceRead])
async def my_attendance(
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    skip: int = 0, limit: int = 50,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    q = select(Attendance).where(Attendance.user_id == user.id)
    if from_date:
        q = q.where(Attendance.attendance_date >= from_date)
    if to_date:
        q = q.where(Attendance.attendance_date <= to_date)
    q = q.order_by(Attendance.attendance_date.desc()).offset(skip).limit(limit)  # type: ignore
    result = await session.exec(q)
    return list(result.all())


@router.put("/attendance/{att_id}", response_model=AttendanceRead)
async def update_attendance(
    att_id: str,
    body: AttendanceCreate,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    a = await session.get(Attendance, att_id)
    if not a:
        raise HTTPException(404, "Attendance record not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(a, k, v)
    session.add(a)
    await session.commit()
    await session.refresh(a)
    return a


# ──────────────────── Bank Details ────────────────────

@router.post("/bank-details", response_model=BankDetailRead, status_code=201)
async def create_bank_detail(
    body: BankDetailCreate,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    bd = BankDetail(**body.model_dump())
    session.add(bd)
    await session.commit()
    await session.refresh(bd)
    return bd


@router.get("/bank-details/{user_id}", response_model=List[BankDetailRead])
async def get_bank_details(
    user_id: str,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    result = await session.exec(select(BankDetail).where(BankDetail.user_id == user_id))
    return list(result.all())


@router.put("/bank-details/{bd_id}", response_model=BankDetailRead)
async def update_bank_detail(
    bd_id: str,
    body: BankDetailCreate,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    bd = await session.get(BankDetail, bd_id)
    if not bd:
        raise HTTPException(404, "Bank detail not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(bd, k, v)
    session.add(bd)
    await session.commit()
    await session.refresh(bd)
    return bd


# ──────────────────── Colleagues ────────────────────

@router.get("/colleagues")
async def list_colleagues(
    branch_id: Optional[str] = None,
    skip: int = 0, limit: int = 50,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    from app.models.user import User
    q = select(User).where(User.is_active == True)  # noqa
    bid = branch_id or getattr(user, "branch_id", None)
    if bid:
        q = q.where(User.branch_id == bid)
    q = q.offset(skip).limit(limit)
    result = await session.exec(q)
    return [{"id": u.id, "name": f"{u.first_name} {u.last_name}", "role_as": u.role_as} for u in result.all()]
