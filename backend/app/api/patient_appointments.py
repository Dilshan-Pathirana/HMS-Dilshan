"""Patient appointment endpoints – Patch 2.2

Prefix: /api/v1/patient/appointments
"""
from __future__ import annotations

from datetime import date, time, datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.api.deps import get_current_user
from app.models.user import User
from app.models.patient import Patient
from app.models.appointment import Appointment, AppointmentRead
from app.services.appointment_service import AppointmentService

router = APIRouter()
svc = AppointmentService


class PatientBookRequest(BaseModel):
    doctor_id: str
    branch_id: str
    date: date
    time: str  # HH:MM
    reason: Optional[str] = None
    department: Optional[str] = None


class RescheduleRequest(BaseModel):
    new_date: date
    new_time: str  # HH:MM


class PaymentConfirmRequest(BaseModel):
    payment_method: str
    payment_reference: Optional[str] = None
    amount: float


# ---- helpers ----

async def _get_patient_id(session: AsyncSession, user_id: str) -> str:
    result = await session.exec(select(Patient).where(Patient.user_id == user_id))
    patient = result.first()
    if not patient:
        raise HTTPException(404, "Patient profile not found")
    return patient.id


# ---- endpoints ----

@router.post("/book", response_model=AppointmentRead)
async def patient_book(
    payload: PatientBookRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    patient_id = await _get_patient_id(session, current_user.id)
    appt_time = datetime.strptime(payload.time, "%H:%M").time()
    return await svc.book(
        session, patient_id, payload.doctor_id, payload.branch_id,
        payload.date, appt_time, current_user.id,
        reason=payload.reason, department=payload.department,
    )


@router.post("/{appointment_id}/confirm-payment")
async def confirm_payment(
    appointment_id: str,
    payload: PaymentConfirmRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await svc.update_payment(
        session, appointment_id, "paid",
        payload.amount, payload.payment_method, payload.payment_reference,
        current_user.id,
    )


@router.get("/my-appointments")
async def my_appointments(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    patient_id = await _get_patient_id(session, current_user.id)
    appointments = await svc.list_by_patient(session, patient_id, status, skip, limit)
    
    # Enrich with slot numbers
    from app.models.patient_session import ScheduleSession
    from app.models.doctor_schedule import DoctorSchedule
    from sqlmodel import col

    session_ids = {a.schedule_session_id for a in appointments if a.schedule_session_id}
    
    if session_ids:
        q_sessions = (
            select(ScheduleSession, DoctorSchedule)
            .join(DoctorSchedule, ScheduleSession.schedule_id == DoctorSchedule.id, isouter=True)
            .where(col(ScheduleSession.id).in_(session_ids))
        )
        session_results = await session.exec(q_sessions)
        session_map = {s.id: (s, ds) for s, ds in session_results.all()}
        
        enriched_appointments = []
        from datetime import datetime as dt_cls
        from datetime import date as date_cls
        
        for appt in appointments:
            appt_read = AppointmentRead.model_validate(appt)
            
            if appt.schedule_session_id and appt.schedule_session_id in session_map:
                sched_session, doc_schedule = session_map[appt.schedule_session_id]
                if sched_session and doc_schedule and doc_schedule.slot_duration_minutes:
                    dummy_date = date_cls(2000, 1, 1)
                    t1 = dt_cls.combine(dummy_date, appt.appointment_time)
                    t2 = dt_cls.combine(dummy_date, sched_session.start_time)
                    diff = t1 - t2
                    minutes = diff.total_seconds() / 60
                    slot_num = int(minutes // doc_schedule.slot_duration_minutes) + 1
                    appt_read.slot_number = slot_num
            
            enriched_appointments.append(appt_read)
        return enriched_appointments

    return appointments


@router.post("/{appointment_id}/cancel")
async def cancel_appointment(
    appointment_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await svc.change_status(session, appointment_id, "cancelled", current_user.id)


@router.get("/{appointment_id}/reschedule-eligibility")
async def reschedule_eligibility(
    appointment_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    appt = await session.get(Appointment, appointment_id)
    if not appt:
        raise HTTPException(404, "Appointment not found")

    eligible = True
    reason = None

    if appt.status not in ("pending", "confirmed", "pending_payment"):
        eligible = False
        reason = f"Cannot reschedule a {appt.status} appointment"
    elif appt.reschedule_count >= 1:
        eligible = False
        reason = "This appointment has already been rescheduled once."
    else:
        appt_datetime = datetime.combine(appt.appointment_date, appt.appointment_time)
        if (appt_datetime - datetime.utcnow()) < timedelta(hours=24):
            eligible = False
            reason = "Appointments can only be rescheduled at least 24 hours in advance."

    return {
        "eligible": eligible,
        "reason": reason,
        "reschedule_count": appt.reschedule_count,
        "status": 200,
        "can_reschedule": eligible,
        "remaining_attempts": max(0, 1 - appt.reschedule_count),
        "max_attempts": 1,
        "is_admin_cancelled": False,
        "appointment_details": {
            "id": appt.id,
            "date": str(appt.appointment_date),
            "time": str(appt.appointment_time),
            "doctor_id": appt.doctor_id,
            "branch_id": appt.branch_id,
            "status": appt.status,
        },
        "settings": {
            "max_advance_booking_days": 30,
            "reschedule_advance_hours": 24,
        },
    }


@router.post("/{appointment_id}/reschedule", response_model=AppointmentRead)
async def reschedule(
    appointment_id: str,
    payload: RescheduleRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    new_time = datetime.strptime(payload.new_time, "%H:%M").time()
    return await svc.reschedule(session, appointment_id, payload.new_date, new_time, current_user.id)


@router.get("/{appointment_id}", response_model=AppointmentRead)
async def get_appointment(
    appointment_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    appt = await session.get(Appointment, appointment_id)
    if not appt:
        raise HTTPException(404, "Appointment not found")
    return appt
