"""Branch-admin appointment endpoints – Patch 2.2

Prefix: /api/v1/branch-admin/appointments
Covers: dashboard, CRUD, statistics, audit logs, settings
"""
from __future__ import annotations

from datetime import date, time, datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlmodel import select, func, col
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.api.deps import get_current_user
from app.models.user import User
from app.models.appointment import Appointment, AppointmentRead
from app.models.appointment_extras import (
    AppointmentAuditLogRead,
    AppointmentSettings,
    AppointmentSettingsCreate,
    AppointmentSettingsRead,
)
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.services.appointment_service import AppointmentService

router = APIRouter()
svc = AppointmentService


# ---------- Dashboard ----------

@router.get("/dashboard")
async def dashboard(
    branch_id: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    bid = branch_id or current_user.branch_id
    today = date.today()
    stats = await svc.get_statistics(session, branch_id=bid, from_date=today, to_date=today)
    return {"branch_id": bid, "date": str(today), **stats}


# ---------- List / Search ----------

@router.get("/list")
async def list_appointments(
    branch_id: Optional[str] = None,
    appt_date: Optional[date] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    bid = branch_id or current_user.branch_id
    if not bid:
        raise HTTPException(400, "branch_id required")
    
    # Get appointments with necessary relations loaded would be better, but service returns simple list.
    # We will fetch them and then enrich.
    appointments = await svc.list_by_branch(session, bid, appt_date, status, skip, limit)
    
    # Enrich with slot numbers
    # 1. Collect schedule_session_ids
    session_ids = {a.schedule_session_id for a in appointments if a.schedule_session_id}
    
    # 2. Fetch ScheduleSessions and their DoctorSchedules
    from app.models.patient_session import ScheduleSession
    from app.models.doctor_schedule import DoctorSchedule
    
    # We need to join to get slot_duration_minutes from DoctorSchedule
    q = (
        select(ScheduleSession, DoctorSchedule)
        .join(DoctorSchedule, ScheduleSession.schedule_id == DoctorSchedule.id, isouter=True)
        .where(col(ScheduleSession.id).in_(session_ids))
    )
    results = await session.exec(q)
    session_map = {
        s.id: (s, ds) for s, ds in results.all()
    }
    
    enriched_appointments = []
    from datetime import datetime
    
    for appt in appointments:
        # Convert to Read model dict
        appt_read = AppointmentRead.model_validate(appt)
        
        # Calculate slot
        if appt.schedule_session_id and appt.schedule_session_id in session_map:
            sched_session, doc_schedule = session_map[appt.schedule_session_id]
            if sched_session and doc_schedule and doc_schedule.slot_duration_minutes:
                # Calculate
                # We need to combine dates to subtract times correctly if they cross midnight (unlikely but safe)
                # Actually times are simple time objects.
                dummy_date = date(2000, 1, 1)
                t1 = datetime.combine(dummy_date, appt.appointment_time)
                t2 = datetime.combine(dummy_date, sched_session.start_time)
                diff = t1 - t2
                minutes = diff.total_seconds() / 60
                slot_num = int(minutes // doc_schedule.slot_duration_minutes) + 1
                appt_read.slot_number = slot_num
        
        enriched_appointments.append(appt_read)
            
    return enriched_appointments


@router.get("/statistics")
async def statistics(
    branch_id: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    bid = branch_id or current_user.branch_id
    return await svc.get_statistics(session, branch_id=bid, from_date=from_date, to_date=to_date)


# ---------- CRUD ----------

class AdminCreateAppointment(BaseModel):
    patient_id: str
    doctor_id: str
    branch_id: str
    date: date
    time: str
    reason: Optional[str] = None
    department: Optional[str] = None
    is_walk_in: bool = False


class AdminCreateWithPatient(BaseModel):
    first_name: str
    last_name: str
    phone: str
    email: Optional[str] = None
    doctor_id: str
    branch_id: str
    date: date
    time: str
    reason: Optional[str] = None
    department: Optional[str] = None


class AdminReschedule(BaseModel):
    new_date: date
    new_time: str


class AdminCancel(BaseModel):
    reason: Optional[str] = None


class AppointmentStatusUpdate(BaseModel):
    status: str
    reason: Optional[str] = None


class PaymentUpdate(BaseModel):
    payment_status: str
    amount: Optional[float] = None
    method: Optional[str] = None
    reference: Optional[str] = None


@router.post("/create", response_model=AppointmentRead)
async def create_appointment(
    payload: AdminCreateAppointment,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    appt_time = datetime.strptime(payload.time, "%H:%M").time()
    return await svc.book(
        session, payload.patient_id, payload.doctor_id, payload.branch_id,
        payload.date, appt_time, current_user.id,
        reason=payload.reason, department=payload.department,
        is_walk_in=payload.is_walk_in,
    )


@router.post("/create-with-patient", response_model=AppointmentRead)
async def create_with_patient(
    payload: AdminCreateWithPatient,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Create appointment + patient in one go (walk-in flow)."""
    from app.core.security import get_password_hash
    from uuid import uuid4

    email = (payload.email or "").strip().lower() or f"walkin_{uuid4().hex[:8]}@guest.local"
    user_result = await session.exec(select(User).where(User.email == email))
    user = user_result.first()
    if not user:
        user = User(
            email=email, username=email,
            hashed_password=get_password_hash(uuid4().hex),
            role_as=5, is_active=True, branch_id=payload.branch_id,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

    pat_result = await session.exec(select(Patient).where(Patient.user_id == user.id))
    patient = pat_result.first()
    if not patient:
        patient = Patient(user_id=user.id, contact_number=payload.phone)
        session.add(patient)
        await session.commit()
        await session.refresh(patient)

    appt_time = datetime.strptime(payload.time, "%H:%M").time()
    return await svc.book(
        session, patient.id, payload.doctor_id, payload.branch_id,
        payload.date, appt_time, current_user.id,
        reason=payload.reason, department=payload.department, is_walk_in=True,
    )


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


@router.post("/{appointment_id}/reschedule", response_model=AppointmentRead)
async def reschedule(
    appointment_id: str,
    payload: AdminReschedule,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    new_time = datetime.strptime(payload.new_time, "%H:%M").time()
    return await svc.reschedule(session, appointment_id, payload.new_date, new_time, current_user.id)


@router.post("/{appointment_id}/cancel")
async def cancel(
    appointment_id: str,
    payload: AdminCancel = AdminCancel(),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await svc.change_status(session, appointment_id, "cancelled", current_user.id, payload.reason)


@router.post("/{appointment_id}/status")
async def update_appointment_status(
    appointment_id: str,
    payload: AppointmentStatusUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Update appointment status (branch admin).

    This endpoint exists to align with frontend expectations.
    """
    status = payload.status
    # Normalize a few common frontend variants.
    status_map = {
        "pending_payment": "pending",
        "in_session": "in_progress",
    }
    normalized = status_map.get(status, status)

    try:
        await svc.change_status(session, appointment_id, normalized, current_user.id, payload.reason)
        return {"message": "Status updated successfully", "new_status": normalized}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{appointment_id}/payment")
async def update_payment(
    appointment_id: str,
    payload: PaymentUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await svc.update_payment(
        session, appointment_id, payload.payment_status,
        payload.amount, payload.method, payload.reference, current_user.id,
    )


# ---------- Audit Logs ----------

@router.get("/{appointment_id}/audit-logs")
async def audit_logs(
    appointment_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    logs = await svc.get_audit_logs(session, appointment_id)
    return {"logs": [l.model_dump() for l in logs]}


# ---------- Settings ----------

@router.get("/settings/{branch_id}", response_model=AppointmentSettingsRead)
async def get_settings(
    branch_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    settings = await svc.get_settings(session, branch_id)
    if not settings:
        raise HTTPException(404, "No settings for this branch")
    return settings


@router.put("/settings/{branch_id}", response_model=AppointmentSettingsRead)
async def upsert_settings(
    branch_id: str,
    payload: AppointmentSettingsCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    data = payload.model_dump(exclude={"branch_id"})
    return await svc.upsert_settings(session, branch_id, data)
