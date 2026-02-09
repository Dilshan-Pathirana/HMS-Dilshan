"""Doctor appointment endpoints – Patch 2.2

Prefix: /api/v1/doctor/appointments
"""
from __future__ import annotations

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select, func
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.api.deps import get_current_user
from app.models.user import User
from app.models.doctor import Doctor
from app.models.appointment import Appointment, AppointmentRead
from app.services.appointment_service import AppointmentService

router = APIRouter()
svc = AppointmentService


async def _get_doctor_id(session: AsyncSession, user_id: str) -> str:
    result = await session.exec(select(Doctor).where(Doctor.user_id == user_id))
    doctor = result.first()
    if not doctor:
        raise HTTPException(404, "Doctor profile not found")
    return doctor.id


@router.get("/list")
async def list_appointments(
    appt_date: Optional[date] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    doctor_id = await _get_doctor_id(session, current_user.id)
    return await svc.list_by_doctor(session, doctor_id, appt_date, status, skip, limit)


@router.get("/today-queue")
async def today_queue(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    doctor_id = await _get_doctor_id(session, current_user.id)
    today = date.today()
    appts = await svc.list_by_doctor(session, doctor_id, today)
    # sort by time, confirmed first
    priority = {"confirmed": 0, "in_progress": 1, "pending": 2}
    appts.sort(key=lambda a: (priority.get(a.status, 9), a.appointment_time))
    return {"date": str(today), "queue": [a.model_dump() for a in appts]}


@router.get("/statistics")
async def statistics(
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    doctor_id = await _get_doctor_id(session, current_user.id)
    return await svc.get_statistics(session, doctor_id=doctor_id, from_date=from_date, to_date=to_date)


@router.post("/{appointment_id}/check-in")
async def check_in(
    appointment_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await svc.change_status(session, appointment_id, "in_progress", current_user.id)


@router.post("/{appointment_id}/start-session")
async def start_session(
    appointment_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Alias for check-in – marks appointment as in_progress."""
    return await svc.change_status(session, appointment_id, "in_progress", current_user.id)


@router.post("/{appointment_id}/complete")
async def complete(
    appointment_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await svc.change_status(session, appointment_id, "completed", current_user.id)


@router.post("/{appointment_id}/no-show")
async def no_show(
    appointment_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await svc.change_status(session, appointment_id, "no_show", current_user.id)
