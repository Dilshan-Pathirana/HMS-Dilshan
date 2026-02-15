from typing import List, Optional
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlmodel import select, func, or_, col
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.models.appointment import Appointment, AppointmentCreate, AppointmentRead
from app.models.visit import Visit, VisitCreate, VisitRead, Queue, QueueCreate, QueueRead
from app.models.patient import Patient, PatientRead
from app.models.doctor import Doctor, DoctorRead
from app.models.branch import Branch, BranchRead
from app.models.user import User
from app.api.deps import get_current_user
from app.services.appointment_service import AppointmentService

router = APIRouter()
svc = AppointmentService

# --- Dashboard Stats ---
@router.get("/dashboard-stats")
async def get_dashboard_stats(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    today = date.today()

    total_appointments = await session.exec(select(func.count(Appointment.id)).where(Appointment.appointment_date == today))
    pending_appointments = await session.exec(select(func.count(Appointment.id)).where(Appointment.status == "pending"))
    completed = await session.exec(
        select(func.count(Appointment.id)).where(Appointment.appointment_date == today, Appointment.status == "completed")
    )
    walk_ins = await session.exec(
        select(func.count(Appointment.id)).where(Appointment.appointment_date == today, Appointment.is_walk_in == True)  # noqa
    )
    queue_count = await session.exec(select(func.count(Queue.id)))

    return {
        "todayAppointments": total_appointments.one() or 0,
        "pendingAppointments": pending_appointments.one() or 0,
        "registeredToday": 0,
        "completedToday": completed.one() or 0,
        "currentQueue": queue_count.one() or 0,
        "walkInsToday": walk_ins.one() or 0,
        "upcomingAppointments": []
    }

# --- Appointments ---
@router.post("/appointments", response_model=AppointmentRead)
async def create_appointment(
    check_in: AppointmentCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    appointment = Appointment.model_validate(check_in)
    session.add(appointment)
    await session.commit()
    await session.refresh(appointment)
    return appointment

@router.get("/appointments", response_model=List[AppointmentRead])
async def read_appointments(
    date: Optional[date] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    query = select(Appointment)
    if date:
        query = query.where(Appointment.appointment_date == date)
    if status:
        query = query.where(Appointment.status == status)

    query = query.offset(skip).limit(limit)
    result = await session.exec(query)
    appointments = result.all()

    # Enrich with slot numbers (Logic duplicated from admin_appointments - consider refactoring to service later)
    from app.models.patient_session import ScheduleSession
    from app.models.doctor_schedule import DoctorSchedule
    
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
        
        for appt in appointments:
            appt_read = AppointmentRead.model_validate(appt)
            
            if appt.schedule_session_id and appt.schedule_session_id in session_map:
                sched_session, doc_schedule = session_map[appt.schedule_session_id]
                if sched_session and doc_schedule and doc_schedule.slot_duration_minutes:
                    dummy_date = date(2000, 1, 1)
                    t1 = dt_cls.combine(dummy_date, appt.appointment_time)
                    t2 = dt_cls.combine(dummy_date, sched_session.start_time)
                    diff = t1 - t2
                    minutes = diff.total_seconds() / 60
                    slot_num = int(minutes // doc_schedule.slot_duration_minutes) + 1
                    appt_read.slot_number = slot_num
            
            enriched_appointments.append(appt_read)
        return enriched_appointments

    return appointments

@router.get("/appointments/{appointment_id}", response_model=AppointmentRead)
async def read_appointment(
    appointment_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    appointment = await session.get(Appointment, appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment

@router.put("/appointments/{appointment_id}", response_model=AppointmentRead)
async def update_appointment(
    appointment_id: str,
    appointment_in: AppointmentCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    appointment = await session.get(Appointment, appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    # For partial updates in REST we usually use PATCH and optional fields.
    # Here we assume PUT replaces or updates available fields.
    appointment_data = appointment_in.model_dump(exclude_unset=True)
    appointment.sqlmodel_update(appointment_data)

    session.add(appointment)
    await session.commit()
    await session.refresh(appointment)
    return appointment

# --- Visits ---
@router.post("/visits", response_model=VisitRead)
async def create_visit(
    visit_in: VisitCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    visit = Visit.model_validate(visit_in)
    visit.visit_number = f"VISIT-{datetime.now().strftime('%Y%m%d%H%M%S')}"

    session.add(visit)
    await session.commit()
    await session.refresh(visit)
    return visit

@router.get("/visits", response_model=List[VisitRead])
async def read_visits(
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    query = select(Visit).offset(skip).limit(limit)
    result = await session.exec(query)
    return result.all()

# --- Queue ---
@router.get("/queue", response_model=List[QueueRead])
async def read_queue(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    result = await session.exec(select(Queue))
    return result.all()

@router.post("/queue/issue-token", response_model=QueueRead)
async def issue_token(
    queue_in: QueueCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    queue_entry = Queue.model_validate(queue_in)
    session.add(queue_entry)
    await session.commit()
    await session.refresh(queue_entry)
    return queue_entry


# ============================================================
# Patch 2.3 — New Receptionist Endpoints
# ============================================================

# --- Patient Management ---

class PatientRegisterRequest(BaseModel):
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: str
    nic: Optional[str] = None
    address: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None


@router.get("/patients/search")
async def search_patients(
    q: str = Query(min_length=2),
    skip: int = 0,
    limit: int = 20,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Search patients by name, email, phone, or NIC."""
    query = (
        select(User)
        .where(
            User.role_as == 5,
            or_(
                User.email.contains(q),
                User.first_name.contains(q),
                User.last_name.contains(q),
                User.contact_number_mobile.contains(q),
                User.nic_number.contains(q),
            ),
        )
        .offset(skip)
        .limit(limit)
    )
    result = await session.exec(query)
    users = result.all()
    return [{"id": u.id, "email": u.email, "first_name": u.first_name, "last_name": u.last_name,
             "phone": u.contact_number_mobile, "nic": u.nic_number} for u in users]


@router.post("/patients/register")
async def register_patient(
    payload: PatientRegisterRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Register a new patient from the receptionist desk."""
    from app.core.security import get_password_hash
    from uuid import uuid4

    email = (payload.email or "").strip().lower() or f"patient_{uuid4().hex[:8]}@guest.local"
    existing = await session.exec(select(User).where(User.email == email))
    if existing.first():
        raise HTTPException(400, "Email already registered")

    user = User(
        email=email,
        username=email,
        hashed_password=get_password_hash(uuid4().hex),
        role_as=5,
        is_active=True,
        first_name=payload.first_name,
        last_name=payload.last_name,
        contact_number_mobile=payload.phone,
        nic_number=payload.nic,
        home_address=payload.address,
        date_of_birth=payload.date_of_birth,
        gender=payload.gender,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)

    patient = Patient(user_id=user.id, contact_number=payload.phone, address=payload.address)
    session.add(patient)
    await session.commit()
    await session.refresh(patient)

    return {"message": "Patient registered", "user_id": user.id, "patient_id": patient.id}


@router.get("/patients/{user_id}")
async def get_patient_details(
    user_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    user = await session.get(User, user_id)
    if not user or user.role_as != 5:
        raise HTTPException(404, "Patient not found")
    pat_result = await session.exec(select(Patient).where(Patient.user_id == user_id))
    patient = pat_result.first()
    return {
        "user": {"id": user.id, "email": user.email, "first_name": user.first_name,
                 "last_name": user.last_name, "phone": user.contact_number_mobile, "nic": user.nic_number},
        "patient": patient.model_dump() if patient else None,
    }


@router.put("/patients/{user_id}")
async def update_patient(
    user_id: str,
    payload: PatientRegisterRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    user = await session.get(User, user_id)
    if not user or user.role_as != 5:
        raise HTTPException(404, "Patient not found")
    user.first_name = payload.first_name
    user.last_name = payload.last_name
    user.contact_number_mobile = payload.phone
    user.nic_number = payload.nic
    user.home_address = payload.address
    if payload.date_of_birth:
        user.date_of_birth = payload.date_of_birth
    if payload.gender:
        user.gender = payload.gender
    session.add(user)
    await session.commit()
    return {"message": "Patient updated"}


# --- Doctors ---

@router.get("/doctors")
async def list_doctors(
    branch_id: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    q = select(Doctor)
    if branch_id:
        from app.models.doctor_branch_link import DoctorBranchLink
        q = (
            q.join(DoctorBranchLink, col(DoctorBranchLink.doctor_id) == Doctor.id)
            .where(DoctorBranchLink.branch_id == branch_id)
        )
    result = await session.exec(q)
    return result.all()


@router.get("/doctors/{doctor_id}/availability")
async def check_doctor_availability(
    doctor_id: str,
    check_date: date = Query(alias="date"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    from app.services.doctor_schedule_service import DoctorScheduleService
    return {"slots": await DoctorScheduleService.check_availability(session, doctor_id, check_date)}


# --- Walk-in appointment ---

class WalkInRequest(BaseModel):
    patient_id: str
    doctor_id: str
    branch_id: str
    reason: Optional[str] = None
    department: Optional[str] = None


@router.post("/appointments/walk-in", response_model=AppointmentRead)
async def walk_in_appointment(
    payload: WalkInRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Create a walk-in appointment for the current time slot."""
    from datetime import datetime as dt
    now = dt.now()
    # Round to nearest 15 min
    minute = (now.minute // 15) * 15
    appt_time = now.replace(minute=minute, second=0, microsecond=0).time()
    return await svc.book(
        session, payload.patient_id, payload.doctor_id, payload.branch_id,
        now.date(), appt_time, current_user.id,
        reason=payload.reason, department=payload.department, is_walk_in=True,
    )


# --- Appointment actions ---

@router.post("/appointments/{appointment_id}/check-in")
async def check_in_appointment(
    appointment_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await svc.change_status(session, appointment_id, "in_progress", current_user.id)


@router.post("/appointments/{appointment_id}/cancel")
async def cancel_appointment(
    appointment_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await svc.change_status(session, appointment_id, "cancelled", current_user.id)


@router.post("/appointments/{appointment_id}/payment")
async def record_payment(
    appointment_id: str,
    amount: float = Query(gt=0),
    method: str = Query(default="cash"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await svc.update_payment(session, appointment_id, "paid", amount, method, None, current_user.id)


# --- Queue management ---

@router.put("/queue/{queue_id}/status")
async def update_queue_status(
    queue_id: str,
    status: str = Query(),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    queue_entry = await session.get(Queue, queue_id)
    if not queue_entry:
        raise HTTPException(404, "Queue entry not found")
    queue_entry.status = status
    session.add(queue_entry)
    await session.commit()
    await session.refresh(queue_entry)
    return queue_entry


@router.get("/queue/stats")
async def queue_stats(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    total = await session.exec(select(func.count(Queue.id)))
    return {"total": total.one() or 0}


# --- Visit details ---

@router.get("/visits/{visit_id}", response_model=VisitRead)
async def get_visit_detail(
    visit_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    visit = await session.get(Visit, visit_id)
    if not visit:
        raise HTTPException(404, "Visit not found")
    return visit


@router.put("/visits/{visit_id}", response_model=VisitRead)
async def update_visit(
    visit_id: str,
    visit_in: VisitCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    visit = await session.get(Visit, visit_id)
    if not visit:
        raise HTTPException(404, "Visit not found")
    for k, v in visit_in.model_dump(exclude_unset=True).items():
        setattr(visit, k, v)
    session.add(visit)
    await session.commit()
    await session.refresh(visit)
    return visit


# --- Reports ---

@router.get("/reports/daily-registrations")
async def daily_registrations(
    report_date: date = Query(alias="date", default=None),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    d = report_date or date.today()
    count = await session.exec(
        select(func.count(Appointment.id)).where(Appointment.appointment_date == d)
    )
    return {"date": str(d), "registrations": count.one() or 0}


@router.get("/reports/appointments")
async def appointment_report(
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await svc.get_statistics(session, from_date=from_date, to_date=to_date)


@router.get("/reports/no-shows")
async def no_show_report(
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    q = select(func.count(Appointment.id)).where(Appointment.status == "no_show")
    if from_date:
        q = q.where(Appointment.appointment_date >= from_date)
    if to_date:
        q = q.where(Appointment.appointment_date <= to_date)
    result = await session.exec(q)
    return {"no_shows": result.one() or 0}


@router.get("/reports/walk-ins")
async def walk_in_report(
    report_date: date = Query(alias="date", default=None),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    d = report_date or date.today()
    count = await session.exec(
        select(func.count(Appointment.id)).where(
            Appointment.appointment_date == d, Appointment.is_walk_in == True  # noqa
        )
    )
    return {"date": str(d), "walk_ins": count.one() or 0}


# --- Profile ---

@router.get("/profile")
async def get_profile(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "phone": current_user.contact_number_mobile,
    }


class ProfileUpdateRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None


@router.put("/profile")
async def update_profile(
    payload: ProfileUpdateRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if payload.first_name:
        current_user.first_name = payload.first_name
    if payload.last_name:
        current_user.last_name = payload.last_name
    if payload.phone:
        current_user.contact_number_mobile = payload.phone
    session.add(current_user)
    await session.commit()
    return {"message": "Profile updated"}


@router.put("/profile/change-password")
async def change_password(
    current_password: str = Query(),
    new_password: str = Query(min_length=6),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    from app.core.security import verify_password, get_password_hash
    if not verify_password(current_password, current_user.hashed_password):
        raise HTTPException(400, "Current password is incorrect")
    current_user.hashed_password = get_password_hash(new_password)
    session.add(current_user)
    await session.commit()
    return {"message": "Password changed"}
