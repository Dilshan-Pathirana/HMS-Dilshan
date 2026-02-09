"""Doctor schedule endpoints – Patch 2.1

~20 endpoints covering:
  - Schedule CRUD
  - Availability check
  - Cancellation workflow (request / approve / reject / list)
  - Schedule modifications CRUD
  - Doctor dashboard stats & profile update
"""
from __future__ import annotations

from datetime import date, time
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlmodel import select, func
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.api.deps import get_current_user
from app.models.user import User
from app.models.doctor import Doctor
from app.models.appointment import Appointment
from app.models.doctor_schedule import (
    DoctorSchedule,
    DoctorScheduleCreate,
    DoctorScheduleRead,
    DoctorScheduleCancellation,
    DoctorScheduleCancellationCreate,
    DoctorScheduleCancellationRead,
    ScheduleModification,
    ScheduleModificationRead,
)
from app.services.doctor_schedule_service import DoctorScheduleService

router = APIRouter()
svc = DoctorScheduleService


# ============================================================
# 1. Schedule CRUD
# ============================================================

@router.post("/", response_model=DoctorScheduleRead)
async def create_schedule(
    payload: DoctorScheduleCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Create a recurring schedule for a doctor (doctor / admin)."""
    data = payload.model_dump()
    schedule = await svc.create_schedule(session, data)
    return schedule


@router.get("/doctor/{doctor_id}", response_model=List[DoctorScheduleRead])
async def get_doctor_schedules(
    doctor_id: str,
    status: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await svc.get_doctor_schedules(session, doctor_id, status)


@router.get("/{schedule_id}", response_model=DoctorScheduleRead)
async def get_schedule(
    schedule_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    schedule = await session.get(DoctorSchedule, schedule_id)
    if not schedule:
        raise HTTPException(404, "Schedule not found")
    return schedule


@router.put("/{schedule_id}", response_model=DoctorScheduleRead)
async def update_schedule(
    schedule_id: str,
    payload: DoctorScheduleCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    data = payload.model_dump(exclude_unset=True)
    return await svc.update_schedule(session, schedule_id, data, current_user.id)


@router.delete("/{schedule_id}")
async def delete_schedule(
    schedule_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    await svc.delete_schedule(session, schedule_id)
    return {"message": "Schedule deleted"}


# ============================================================
# 2. Availability / Slots
# ============================================================

class AvailabilityRequest(BaseModel):
    doctor_id: str
    date: date
    branch_id: Optional[str] = None


@router.post("/check-availability")
async def check_availability(
    payload: AvailabilityRequest,
    session: AsyncSession = Depends(get_session),
):
    """Public – returns available time-slots for a doctor on a date."""
    slots = await svc.check_availability(session, payload.doctor_id, payload.date, payload.branch_id)
    return {"slots": slots}


# ============================================================
# 3. Cancellation Workflow
# ============================================================

@router.post("/cancel/request", response_model=DoctorScheduleCancellationRead)
async def request_cancellation(
    payload: DoctorScheduleCancellationCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    data = payload.model_dump()
    return await svc.request_cancellation(session, data)


@router.post("/cancel/approve/{cancel_id}", response_model=DoctorScheduleCancellationRead)
async def approve_cancellation(
    cancel_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await svc.approve_cancellation(session, cancel_id, current_user.id)


@router.post("/cancel/reject/{cancel_id}", response_model=DoctorScheduleCancellationRead)
async def reject_cancellation(
    cancel_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await svc.reject_cancellation(session, cancel_id, current_user.id)


@router.get("/cancel/requests", response_model=List[DoctorScheduleCancellationRead])
async def list_cancellation_requests(
    status: Optional[str] = None,
    doctor_id: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await svc.list_cancellation_requests(session, status, doctor_id)


# ============================================================
# 4. Schedule Modifications CRUD
# ============================================================

@router.get("/modifications", response_model=List[ScheduleModificationRead])
async def list_modifications(
    schedule_id: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await svc.list_modifications(session, schedule_id)


@router.get("/modifications/{mod_id}", response_model=ScheduleModificationRead)
async def get_modification(
    mod_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    mod = await session.get(ScheduleModification, mod_id)
    if not mod:
        raise HTTPException(404, "Modification not found")
    return mod


@router.delete("/modifications/{mod_id}")
async def delete_modification(
    mod_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    mod = await session.get(ScheduleModification, mod_id)
    if not mod:
        raise HTTPException(404, "Modification not found")
    await session.delete(mod)
    await session.commit()
    return {"message": "Modification deleted"}


# ============================================================
# 5. Doctor dashboard stats
# ============================================================

@router.get("/doctor/{doctor_id}/dashboard-stats")
async def doctor_dashboard_stats(
    doctor_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    today = date.today()

    total_today = await session.exec(
        select(func.count(Appointment.id)).where(
            Appointment.doctor_id == doctor_id,
            Appointment.appointment_date == today,
        )
    )
    completed = await session.exec(
        select(func.count(Appointment.id)).where(
            Appointment.doctor_id == doctor_id,
            Appointment.appointment_date == today,
            Appointment.status == "completed",
        )
    )
    pending = await session.exec(
        select(func.count(Appointment.id)).where(
            Appointment.doctor_id == doctor_id,
            Appointment.status == "pending",
        )
    )
    schedules_count = await session.exec(
        select(func.count(DoctorSchedule.id)).where(
            DoctorSchedule.doctor_id == doctor_id,
            DoctorSchedule.status == "active",
        )
    )

    return {
        "todayPatients": total_today.one() or 0,
        "completedToday": completed.one() or 0,
        "pendingConsultations": pending.one() or 0,
        "activeSchedules": schedules_count.one() or 0,
    }


# ============================================================
# 6. Doctor profile update
# ============================================================

class DoctorProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    specialization: Optional[str] = None
    qualification: Optional[str] = None
    contact_number: Optional[str] = None
    experience_years: Optional[int] = None


@router.put("/doctor/{user_id}/profile")
async def update_doctor_profile(
    user_id: str,
    payload: DoctorProfileUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    result = await session.exec(select(Doctor).where(Doctor.user_id == user_id))
    doctor = result.first()
    if not doctor:
        raise HTTPException(404, "Doctor profile not found")

    update_data = payload.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        if hasattr(doctor, key):
            setattr(doctor, key, val)
    session.add(doctor)
    await session.commit()
    await session.refresh(doctor)
    return {"message": "Profile updated", "doctor_id": doctor.id}
