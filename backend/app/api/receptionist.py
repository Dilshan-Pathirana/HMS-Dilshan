from typing import List, Optional
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import select, func, or_
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.models.appointment import Appointment, AppointmentCreate, AppointmentRead
from app.models.visit import Visit, VisitCreate, VisitRead, Queue, QueueCreate, QueueRead
from app.models.patient import Patient, PatientRead
from app.models.doctor import Doctor, DoctorRead
from app.models.branch import Branch, BranchRead

router = APIRouter()

# --- Dashboard Stats ---
@router.get("/dashboard-stats")
async def get_dashboard_stats(
    session: AsyncSession = Depends(get_session),
):
    today = date.today()

    # Simple count queries
    total_appointments = await session.exec(select(func.count(Appointment.id)).where(Appointment.appointment_date == today))
    pending_appointments = await session.exec(select(func.count(Appointment.id)).where(Appointment.status == "pending"))

    return {
        "todayAppointments": total_appointments.one() or 0,
        "pendingAppointments": pending_appointments.one() or 0,
        "registeredToday": 0,
        "completedToday": 0,
        "currentQueue": 0,
        "walkInsToday": 0,
        "upcomingAppointments": []
    }

# --- Appointments ---
@router.post("/appointments", response_model=AppointmentRead)
async def create_appointment(
    check_in: AppointmentCreate,
    session: AsyncSession = Depends(get_session)
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
    session: AsyncSession = Depends(get_session)
):
    query = select(Appointment)
    if date:
        query = query.where(Appointment.appointment_date == date)
    if status:
        query = query.where(Appointment.status == status)

    query = query.offset(skip).limit(limit)
    result = await session.exec(query)
    appointments = result.all()
    return appointments

@router.get("/appointments/{appointment_id}", response_model=AppointmentRead)
async def read_appointment(
    appointment_id: str,
    session: AsyncSession = Depends(get_session)
):
    appointment = await session.get(Appointment, appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment

@router.put("/appointments/{appointment_id}", response_model=AppointmentRead)
async def update_appointment(
    appointment_id: str,
    appointment_in: AppointmentCreate,
    session: AsyncSession = Depends(get_session)
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
    session: AsyncSession = Depends(get_session)
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
    session: AsyncSession = Depends(get_session)
):
    query = select(Visit).offset(skip).limit(limit)
    result = await session.exec(query)
    return result.all()

# --- Queue ---
@router.get("/queue", response_model=List[QueueRead])
async def read_queue(
    session: AsyncSession = Depends(get_session)
):
    result = await session.exec(select(Queue))
    return result.all()

@router.post("/queue/issue-token", response_model=QueueRead)
async def issue_token(
    queue_in: QueueCreate,
    session: AsyncSession = Depends(get_session)
):
    queue_entry = Queue.model_validate(queue_in)
    session.add(queue_entry)
    await session.commit()
    await session.refresh(queue_entry)
    return queue_entry
