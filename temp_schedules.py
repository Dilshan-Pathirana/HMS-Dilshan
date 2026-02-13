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
from datetime import timedelta
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlmodel import select, func
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.api.deps import get_current_user
from app.models.user import User
from app.models.doctor import Doctor
from app.models.appointment import Appointment
from app.models.branch import Branch
from app.models.doctor_schedule import (
    DoctorSchedule,
    DoctorScheduleCreate,
    DoctorScheduleRead,
    DoctorScheduleCancellation,
    DoctorScheduleCancellationCreate,
    DoctorScheduleCancellationRead,
    ScheduleModification,
    ScheduleModificationCreate,
    ScheduleModificationRead,
)
from app.services.doctor_schedule_service import DoctorScheduleService

router = APIRouter()
svc = DoctorScheduleService


# ============================================================
# 0. Calendar Listing (Super Admin)
# ============================================================


class ScheduleCalendarSlot(BaseModel):
    schedule_id: str
    doctor_id: str
    doctor_name: str
    branch_id: str
    branch_name: str
    date: date
    start_time: time
    end_time: time
    slot_duration_minutes: int
    max_patients: int
    booked_count: int
    status: str  # available | full | blocked


class SchedulesCalendarResponse(BaseModel):
    status: int = 200
    start_date: date
    end_date: date
    slots_by_date: Dict[str, List[ScheduleCalendarSlot]]


def _iter_dates(start: date, end: date):
    cur = start
    while cur <= end:
        yield cur
        cur = cur + timedelta(days=1)


@router.get("/calendar", response_model=SchedulesCalendarResponse)
@router.get("/", response_model=SchedulesCalendarResponse)
async def list_schedules_calendar(
    start_date: date = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: date = Query(..., description="End date (YYYY-MM-DD)"),
    branch_id: Optional[str] = Query(default=None),
    doctor_id: Optional[str] = Query(default=None),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Super Admin calendar listing.

    Returns schedule occurrences grouped by date for calendar rendering.
    """
    if current_user.role_as != 1:
        raise HTTPException(403, "Not authorized")

    if end_date < start_date:
        raise HTTPException(422, "end_date must be >= start_date")

    # Fetch base schedules
    sched_q = select(DoctorSchedule)
    if doctor_id:
        sched_q = sched_q.where(DoctorSchedule.doctor_id == doctor_id)
    if branch_id:
        sched_q = sched_q.where(DoctorSchedule.branch_id == branch_id)

    sched_result = await session.exec(sched_q)
    schedules = list(sched_result.all())

    # Short-circuit
    if not schedules:
        return SchedulesCalendarResponse(start_date=start_date, end_date=end_date, slots_by_date={})

    # Lookups for names
    doctor_ids = {s.doctor_id for s in schedules}
    branch_ids = {s.branch_id for s in schedules}

    doctors_by_id: Dict[str, Doctor] = {}
    branches_by_id: Dict[str, Branch] = {}
    if doctor_ids:
        d_res = await session.exec(select(Doctor).where(Doctor.id.in_(doctor_ids)))
        doctors_by_id = {d.id: d for d in d_res.all()}
    if branch_ids:
        b_res = await session.exec(select(Branch).where(Branch.id.in_(branch_ids)))
        branches_by_id = {b.id: b for b in b_res.all()}

    # Approved cancellations in range (blocks specific schedule occurrences)
    canc_q = select(DoctorScheduleCancellation).where(
        DoctorScheduleCancellation.status == "approved",
        DoctorScheduleCancellation.cancel_date <= end_date,
        (DoctorScheduleCancellation.cancel_end_date.is_(None) | (DoctorScheduleCancellation.cancel_end_date >= start_date)),
    )
    if doctor_id:
        canc_q = canc_q.where(DoctorScheduleCancellation.doctor_id == doctor_id)
    if schedules:
        canc_q = canc_q.where(DoctorScheduleCancellation.schedule_id.in_([s.id for s in schedules]))

    canc_result = await session.exec(canc_q)
    blocked: set[tuple[str, date]] = set()
    for c in canc_result.all():
        end_d = c.cancel_end_date or c.cancel_date
        for d in _iter_dates(max(start_date, c.cancel_date), min(end_date, end_d)):
            blocked.add((c.schedule_id, d))

    # Appointments in range for booked counts
    appt_q = select(Appointment).where(
        Appointment.appointment_date >= start_date,
        Appointment.appointment_date <= end_date,
        Appointment.status != "cancelled",
    )
    if doctor_id:
        appt_q = appt_q.where(Appointment.doctor_id == doctor_id)
    if branch_id:
        appt_q = appt_q.where(Appointment.branch_id == branch_id)

    appt_result = await session.exec(appt_q)
    appts = list(appt_result.all())
    appts_by_key: Dict[tuple[str, str, date], List[time]] = {}
    for a in appts:
        appts_by_key.setdefault((a.doctor_id, a.branch_id, a.appointment_date), []).append(a.appointment_time)

    def valid_on(s: DoctorSchedule, d: date) -> bool:
        if s.valid_from is not None and d < s.valid_from:
            return False
        if s.valid_until is not None and d > s.valid_until:
            return False
        return True

    slots_by_date: Dict[str, List[ScheduleCalendarSlot]] = {}

    for d in _iter_dates(start_date, end_date):
        weekday = d.weekday()  # Monday=0..Sunday=6
        day_items: List[ScheduleCalendarSlot] = []

        for s in schedules:
            if not valid_on(s, d):
                continue

            # Recurrence handling
            if s.recurrence_type == "once":
                if s.valid_from and s.valid_from != d:
                    continue
            elif s.recurrence_type == "biweekly":
                if s.valid_from:
                    weeks = (d - s.valid_from).days // 7
                    if weeks % 2 != 0:
                        continue

            if s.day_of_week != weekday:
                continue

            doc = doctors_by_id.get(s.doctor_id)
            brn = branches_by_id.get(s.branch_id)
            doctor_name = f"{doc.first_name} {doc.last_name}".strip() if doc else s.doctor_id
            branch_name = brn.center_name if brn else s.branch_id

            times = appts_by_key.get((s.doctor_id, s.branch_id, d), [])
            booked_count = sum(1 for t in times if s.start_time <= t < s.end_time)

            is_blocked = (s.status != "active") or ((s.id, d) in blocked)
            if is_blocked:
                status = "blocked"
            elif booked_count >= (s.max_patients or 0):
                status = "full"
            else:
                status = "available"

            day_items.append(
                ScheduleCalendarSlot(
                    schedule_id=s.id,
                    doctor_id=s.doctor_id,
                    doctor_name=doctor_name,
                    branch_id=s.branch_id,
                    branch_name=branch_name,
                    date=d,
                    start_time=s.start_time,
                    end_time=s.end_time,
                    slot_duration_minutes=s.slot_duration_minutes,
                    max_patients=s.max_patients,
                    booked_count=booked_count,
                    status=status,
                )
            )

        if day_items:
            slots_by_date[d.isoformat()] = day_items

    return SchedulesCalendarResponse(
        start_date=start_date,
        end_date=end_date,
        slots_by_date=slots_by_date,
    )


# ============================================================
# 4. Schedule Modifications CRUD
# ============================================================

class ModificationRequest(BaseModel):
    doctor_id: str
    branch_id: Optional[str] = None
    schedule_id: Optional[str] = None
    request_type: str
    start_date: date
    end_date: Optional[date] = None
    new_start_time: Optional[str] = None
    new_end_time: Optional[str] = None
    new_max_patients: Optional[int] = None
    reason: Optional[str] = None
    parent_request_id: Optional[str] = None


@router.post("/modifications", response_model=ScheduleModificationRead)
async def create_modification(
    payload: ModificationRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    # Map frontend payload to backend model
    # We store the specific request details in `new_value` as JSON
    import json
    
    # Extract known fields for validation/logic
    req_data = payload.model_dump()
    
    # Construct DB model data
    db_data = {
        "doctor_id": payload.doctor_id,
        "schedule_id": payload.schedule_id,
        "modification_type": payload.request_type,
        "status": "pending",
        # Store all request details in new_value
        "new_value": json.dumps(req_data, default=str),
        "old_value": None 
    }
    
    return await svc.create_modification(session, db_data)


@router.put("/modifications/{mod_id}", response_model=ScheduleModificationRead)
async def update_modification(
    mod_id: str,
    payload: ModificationRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    import json
    req_data = payload.model_dump()
    
    # Only update the stored payload (new_value), maybe status or type if changed
    update_data = {
         "modification_type": payload.request_type,
         "new_value": json.dumps(req_data, default=str)
    }
    
    # If schedule_id changed, update it too
    if payload.schedule_id:
        update_data["schedule_id"] = payload.schedule_id
        
    return await svc.update_modification(session, mod_id, update_data, current_user.id)


@router.get("/modifications", response_model=List[ScheduleModificationRead])
async def list_modifications(
    schedule_id: Optional[str] = None,
    doctor_id: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await svc.list_modifications(session, schedule_id, doctor_id)


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
