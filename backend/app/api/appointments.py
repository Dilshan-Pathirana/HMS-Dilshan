from __future__ import annotations

from datetime import date, datetime, time, timedelta
from typing import Dict, List, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field as PydanticField
from sqlalchemy.exc import IntegrityError
from sqlalchemy import or_
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.core.security import get_password_hash
from app.models.appointment import Appointment
from app.models.branch import Branch
from app.models.doctor import Doctor
from app.models.doctor_availability import DoctorAvailability
from app.models.doctor_schedule import DoctorSchedule
from app.models.patient import Patient
from app.models.user import User
from app.services.appointment_service import AppointmentService


router = APIRouter()


class AppointmentSearchResult(BaseModel):
    date: date
    branch_id: str
    branch_name: str
    doctor_id: str
    doctor_name: str
    specialisation: str
    time_slots: List[str]


class AppointmentSearchResponse(BaseModel):
    results: List[AppointmentSearchResult]


def _time_to_str(t: time) -> str:
    return t.strftime("%H:%M")


def _iter_slots(start: time, end: time, minutes: int) -> List[time]:
    start_dt = datetime.combine(date(2000, 1, 1), start)
    end_dt = datetime.combine(date(2000, 1, 1), end)
    if end_dt <= start_dt:
        return []
    out: List[time] = []
    current = start_dt
    step = timedelta(minutes=minutes)
    while current + step <= end_dt:
        out.append(current.time())
        current += step
    return out


def _weekday_name(day_index: int) -> str:
    names = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
    ]
    if 0 <= day_index < len(names):
        return names[day_index]
    return ""


@router.get("/search", response_model=AppointmentSearchResponse)
async def search_appointments(
    doctor_id: Optional[str] = None,
    branch_id: Optional[str] = None,
    specialisation: Optional[str] = Query(default=None, max_length=255),
    date_: Optional[date] = Query(default=None, alias="date"),
    session: AsyncSession = Depends(get_session),
):
    """Public availability search.

    At least one filter must be provided (doctor, branch, specialisation, date).
    If date is omitted, returns upcoming availability for the next 14 days.
    Excludes blocked availability windows and already-booked slots.
    """

    if not any([doctor_id, branch_id, specialisation, date_]):
        raise HTTPException(
            status_code=400,
            detail="Please select at least one search criterion.",
        )

    today = date.today()
    end_date = today + timedelta(days=14)

    availability_query = select(DoctorAvailability).where(
        DoctorAvailability.is_blocked == False  # noqa: E712
    )

    if doctor_id:
        availability_query = availability_query.where(
            DoctorAvailability.doctor_id == doctor_id
        )
    if branch_id:
        availability_query = availability_query.where(
            DoctorAvailability.branch_id == branch_id
        )
    if specialisation:
        availability_query = availability_query.where(
            DoctorAvailability.specialisation == specialisation
        )

    if date_:
        availability_query = availability_query.where(
            DoctorAvailability.availability_date == date_
        )
    else:
        availability_query = availability_query.where(
            DoctorAvailability.availability_date >= today,
            DoctorAvailability.availability_date <= end_date,
        )

    availability_result = await session.exec(availability_query)
    windows = availability_result.all()
    if not windows:
        return AppointmentSearchResponse(results=[])

    # Preload doctors/branches for display
    doctor_ids = list({w.doctor_id for w in windows})
    branch_ids = list({w.branch_id for w in windows})

    doctors_result = await session.exec(select(Doctor).where(Doctor.id.in_(doctor_ids)))
    doctors = {d.id: d for d in doctors_result.all()}

    branches_result = await session.exec(select(Branch).where(Branch.id.in_(branch_ids)))
    branches = {b.id: b for b in branches_result.all()}

    # Fetch booked slots for all relevant (doctor, branch, date)
    dates = list({w.availability_date for w in windows})
    appt_query = select(Appointment).where(
        Appointment.doctor_id.in_(doctor_ids),
        Appointment.branch_id.in_(branch_ids),
        Appointment.appointment_date.in_(dates),
        Appointment.status != "cancelled",
    )
    appt_result = await session.exec(appt_query)
    booked = appt_result.all()
    booked_set = {
        (a.doctor_id, a.branch_id, a.appointment_date, _time_to_str(a.appointment_time))
        for a in booked
    }

    results: List[AppointmentSearchResult] = []
    for w in windows:
        slot_times = _iter_slots(w.start_time, w.end_time, w.slot_minutes)
        slot_strs = [
            _time_to_str(t)
            for t in slot_times
            if (w.doctor_id, w.branch_id, w.availability_date, _time_to_str(t))
            not in booked_set
        ]
        if not slot_strs:
            continue

        doctor = doctors.get(w.doctor_id)
        branch = branches.get(w.branch_id)

        results.append(
            AppointmentSearchResult(
                date=w.availability_date,
                branch_id=w.branch_id,
                branch_name=branch.center_name if branch else "",
                doctor_id=w.doctor_id,
                doctor_name=(
                    f"{doctor.first_name} {doctor.last_name}" if doctor else ""
                ),
                specialisation=w.specialisation,
                time_slots=slot_strs,
            )
        )

    # Stable ordering for UI grouping
    results.sort(key=lambda r: (r.date, r.branch_name, r.doctor_name, r.specialisation))
    return AppointmentSearchResponse(results=results)


@router.get("/cities")
async def list_appointment_cities(
    session: AsyncSession = Depends(get_session),
):
    branches_res = await session.exec(select(Branch))
    branches = branches_res.all() or []
    cities = sorted({(b.division or b.center_name).strip() for b in branches if (b.division or b.center_name)})
    return {"status": 200, "cities": cities}


@router.get("/specializations")
async def list_appointment_specializations(
    session: AsyncSession = Depends(get_session),
):
    doctors_res = await session.exec(select(Doctor))
    doctors = doctors_res.all() or []
    specs = sorted({d.specialization.strip() for d in doctors if d.specialization})
    return {"status": 200, "specializations": specs}


@router.get("/branches")
async def list_appointment_branches(
    session: AsyncSession = Depends(get_session),
):
    branches_res = await session.exec(select(Branch))
    branches = branches_res.all() or []
    payload = [
        {
            "id": b.id,
            "name": b.center_name,
            "location": b.division,
            "address": None,
        }
        for b in branches
    ]
    return {"status": 200, "branches": payload}


@router.get("/doctors/search")
async def search_doctors(
    branch_id: Optional[str] = None,
    specialization: Optional[str] = None,
    doctor_name: Optional[str] = None,
    date_: Optional[date] = Query(default=None, alias="date"),
    session: AsyncSession = Depends(get_session),
):
    schedules_query = (
        select(DoctorSchedule, Doctor, Branch)
        .join(Doctor, Doctor.id == DoctorSchedule.doctor_id)
        .join(Branch, Branch.id == DoctorSchedule.branch_id)
        .where(DoctorSchedule.status == "active")
    )

    if branch_id:
        schedules_query = schedules_query.where(DoctorSchedule.branch_id == branch_id)
    if specialization:
        schedules_query = schedules_query.where(Doctor.specialization == specialization)
    if doctor_name:
        term = f"%{doctor_name.strip()}%"
        schedules_query = schedules_query.where(
            or_(
                Doctor.first_name.ilike(term),
                Doctor.last_name.ilike(term),
            )
        )
    if date_:
        weekday = date_.weekday()
        schedules_query = schedules_query.where(DoctorSchedule.day_of_week == weekday)
        schedules_query = schedules_query.where(
            or_(DoctorSchedule.valid_from == None, DoctorSchedule.valid_from <= date_),  # noqa: E711
            or_(DoctorSchedule.valid_until == None, DoctorSchedule.valid_until >= date_),  # noqa: E711
        )

    result = await session.exec(schedules_query)
    rows = result.all()

    doctors: Dict[str, Dict[str, object]] = {}
    for schedule, doctor, branch in rows:
        if doctor.id not in doctors:
            full_name = f"{doctor.first_name} {doctor.last_name}".strip()
            doctors[doctor.id] = {
                "doctor_id": doctor.id,
                "first_name": doctor.first_name,
                "last_name": doctor.last_name,
                "full_name": full_name,
                "name": full_name,
                "specialization": doctor.specialization,
                "qualification": doctor.qualification,
                "profile_picture": None,
                "schedules": [],
            }

        doctors[doctor.id]["schedules"].append(
            {
                "id": schedule.id,
                "schedule_id": schedule.id,
                "branch_id": schedule.branch_id,
                "branch_name": branch.center_name if branch else "",
                "branch_city": branch.division if branch else None,
                "schedule_day": _weekday_name(schedule.day_of_week),
                "start_time": _time_to_str(schedule.start_time),
                "end_time": _time_to_str(schedule.end_time),
                "max_patients": schedule.max_patients,
                "time_per_patient": schedule.slot_duration_minutes,
            }
        )

    for doctor in doctors.values():
        doctor["schedules"] = sorted(
            doctor["schedules"],
            key=lambda s: (s.get("schedule_day", ""), s.get("start_time", "")),
        )

    sorted_doctors = sorted(
        doctors.values(),
        key=lambda d: (d.get("full_name") or d.get("name") or ""),
    )

    return {"status": 200, "doctors": sorted_doctors}


class VisitorPatientDetails(BaseModel):
    first_name: str = PydanticField(min_length=1)
    last_name: str = PydanticField(min_length=1)
    phone: str = PydanticField(min_length=5)
    nic: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None


class AppointmentBookRequest(BaseModel):
    doctor_id: str
    branch_id: str
    specialisation: Optional[str] = None
    date: date
    time: str  # HH:MM
    patient: VisitorPatientDetails


class AppointmentBookResponse(BaseModel):
    appointment_id: str


@router.post("/book", response_model=AppointmentBookResponse)
async def book_appointment(
    payload: AppointmentBookRequest,
    session: AsyncSession = Depends(get_session),
):
    """Public booking endpoint.

    Creates (or reuses) a User+Patient profile for the visitor, then creates the Appointment.
    Slot locking is enforced by a unique constraint on (doctor_id, branch_id, appointment_date, appointment_time).
    """

    # Validate doctor/branch exist
    doctor = await session.get(Doctor, payload.doctor_id)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    branch = await session.get(Branch, payload.branch_id)
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")

    try:
        appointment_time = datetime.strptime(payload.time, "%H:%M").time()
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid time format. Use HH:MM")

    # Resolve or create user (guest/patient)
    email = (payload.patient.email or "").strip().lower() or None
    user: Optional[User] = None
    if email:
        existing_user_result = await session.exec(select(User).where(User.email == email))
        user = existing_user_result.first()

    if not user:
        # Generate a unique email if none provided
        generated_email = email or f"guest_{uuid4().hex}@guest.local"
        user = User(
            email=generated_email,
            username=generated_email,
            hashed_password=get_password_hash(uuid4().hex),
            role_as=5,  # Patient
            is_active=True,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

    # Ensure patient profile exists
    patient_result = await session.exec(select(Patient).where(Patient.user_id == user.id))
    patient = patient_result.first()
    if not patient:
        patient = Patient(
            user_id=user.id,
            address=payload.patient.address,
            contact_number=payload.patient.phone,
        )
        session.add(patient)
        await session.commit()
        await session.refresh(patient)

    # Create appointment with slot lock
    try:
        appointment = await AppointmentService.book(
            session,
            patient.id,
            payload.doctor_id,
            payload.branch_id,
            payload.date,
            appointment_time,
            user.id,
            reason=payload.patient.nic,
            department=payload.specialisation,
            is_walk_in=False,
        )
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=409, detail="Selected slot is no longer available")
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to book appointment: {str(e)}")

    return AppointmentBookResponse(appointment_id=appointment.id)
