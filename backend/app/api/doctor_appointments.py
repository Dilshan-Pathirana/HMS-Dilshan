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
    appointments = await svc.list_by_doctor(session, doctor_id, appt_date, status, skip, limit)
    return await _enrich_with_slots(session, appointments)


@router.get("/today-queue")
async def today_queue(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    doctor_id = await _get_doctor_id(session, current_user.id)
    today = date.today()
    appts = await svc.list_by_doctor(session, doctor_id, today)
    
    # Enrich with slots
    enriched_appts = await _enrich_with_slots(session, appts)
    
    # sort by time, confirmed first
    priority = {"confirmed": 0, "in_progress": 1, "pending": 2}
    enriched_appts.sort(key=lambda a: (priority.get(a.status, 9), a.appointment_time))
    
    # Return as dicts (since queue endpoint returns a dict structure)
    return {"date": str(today), "queue": [a.model_dump() for a in enriched_appts]}


async def _enrich_with_slots(session: AsyncSession, appointments: list[Appointment]) -> list[AppointmentRead]:
    """Helper to enrich appointments with slot numbers."""
    from app.models.patient_session import ScheduleSession
    from app.models.doctor_schedule import DoctorSchedule
    from sqlmodel import col, select
    
    # 1. Collect schedule_session_ids
    session_ids = {a.schedule_session_id for a in appointments if a.schedule_session_id}
    
    # 2. Fetch ScheduleSessions and their DoctorSchedules
    if not session_ids:
        return [AppointmentRead.model_validate(a) for a in appointments]
        
    q = (
        select(ScheduleSession, DoctorSchedule)
        .join(DoctorSchedule, ScheduleSession.schedule_id == DoctorSchedule.id, isouter=True)
        .where(col(ScheduleSession.id).in_(session_ids))
    )
    results = await session.exec(q)
    session_map = {s.id: (s, ds) for s, ds in results.all()}
    
    enriched_appointments = []
    from datetime import datetime as dt_cls
    from datetime import date as date_cls
    
    for appt in appointments:
        # Convert to Read model dict
        appt_read = AppointmentRead.model_validate(appt)
        
        # Calculate slot
        if appt.schedule_session_id and appt.schedule_session_id in session_map:
            sched_session, doc_schedule = session_map[appt.schedule_session_id]
            if sched_session and doc_schedule and doc_schedule.slot_duration_minutes:
                # Calculate
                dummy_date = date_cls(2000, 1, 1)
                t1 = dt_cls.combine(dummy_date, appt.appointment_time)
                t2 = dt_cls.combine(dummy_date, sched_session.start_time)
                diff = t1 - t2
                minutes = diff.total_seconds() / 60
                slot_num = int(minutes // doc_schedule.slot_duration_minutes) + 1
                appt_read.slot_number = slot_num
        
        enriched_appointments.append(appt_read)
            
    return enriched_appointments


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
