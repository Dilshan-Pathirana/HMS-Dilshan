from __future__ import annotations

from typing import Optional, Dict, List
from datetime import date, datetime

from fastapi import APIRouter, Depends
from sqlmodel import select, col, func, or_
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.deps import get_current_active_superuser
from app.core.database import get_session
from app.models.appointment import Appointment
from app.models.branch import Branch
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.user import User

router = APIRouter(prefix="/api/v1/super-admin/appointments", tags=["Super Admin Appointments"])


def _full_name(first: Optional[str], last: Optional[str]) -> str:
    parts = [p for p in [(first or "").strip(), (last or "").strip()] if p]
    return " ".join(parts) if parts else "Unknown"


@router.get("/")
async def list_all_appointments(
    skip: int = 0,
    limit: int = 500,
    show_all: bool = False,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser),
):
    """
    Super admin endpoint.
    Returns ALL appointments in system.
    By default, shows upcoming and current day appointments only.
    Set show_all=true to see all historical appointments.
    """

    today = date.today()

    # ---- Base query ----
    base_query = select(Appointment)
    
    # Filter by date unless show_all is true
    if not show_all:
        base_query = base_query.where(col(Appointment.appointment_date) >= today)

    # ---- total count ----
    count_query = select(func.count(Appointment.id))
    if not show_all:
        count_query = count_query.where(col(Appointment.appointment_date) >= today)
    
    total = (await session.exec(count_query)).one()

    # ---- fetch appointments ----
    query = (
        base_query
        .order_by(
            col(Appointment.appointment_date).asc(),  # Changed to ascending - upcoming first
            col(Appointment.appointment_time).asc(),
        )
        .offset(skip)
        .limit(limit)
    )
    appointments: List[Appointment] = (await session.exec(query)).all()

    # ---- collect ids ----
    patient_ids = {a.patient_id for a in appointments if a.patient_id}
    doctor_ids = {a.doctor_id for a in appointments if a.doctor_id}
    branch_ids = {a.branch_id for a in appointments if a.branch_id}

    # ---- fetch related ----
    patients: Dict[str, Patient] = {}
    patient_users: Dict[str, User] = {}
    doctors: Dict[str, Doctor] = {}
    doctor_users: Dict[str, User] = {}
    branches: Dict[str, Branch] = {}

    # Patients
    if patient_ids:
        res = await session.exec(select(Patient).where(col(Patient.id).in_(patient_ids)))
        patients = {p.id: p for p in res.all()}

        user_ids = {p.user_id for p in patients.values() if p.user_id}
        if user_ids:
            ures = await session.exec(select(User).where(col(User.id).in_(user_ids)))
            patient_users = {u.id: u for u in ures.all()}

    # Doctors
    if doctor_ids:
        res = await session.exec(select(Doctor).where(col(Doctor.id).in_(doctor_ids)))
        doctors = {d.id: d for d in res.all()}

        user_ids = {d.user_id for d in doctors.values() if d.user_id}
        if user_ids:
            ures = await session.exec(select(User).where(col(User.id).in_(user_ids)))
            doctor_users = {u.id: u for u in ures.all()}

    # Branches
    if branch_ids:
        res = await session.exec(select(Branch).where(col(Branch.id).in_(branch_ids)))
        branches = {b.id: b for b in res.all()}

    # ---- map response ----
    data = []

    for appt in appointments:
        # patient name
        patient_name = "Unknown"
        if appt.patient_id in patients:
            p = patients[appt.patient_id]
            if p.user_id in patient_users:
                u = patient_users[p.user_id]
                patient_name = _full_name(u.first_name, u.last_name)

        # doctor name
        doctor_name = "Unknown"
        if appt.doctor_id in doctors:
            d = doctors[appt.doctor_id]
            if d.user_id in doctor_users:
                u = doctor_users[d.user_id]
                doctor_name = _full_name(u.first_name, u.last_name)

        # branch
        branch_name = "Unknown"
        if appt.branch_id in branches:
            branch_name = branches[appt.branch_id].center_name

        data.append({
            "id": appt.id,
            "patient_name": patient_name,
            "patient_id": appt.patient_id,
            "doctor_name": doctor_name,
            "doctor_id": appt.doctor_id,
            "branch_name": branch_name,
            "branch_id": appt.branch_id,
            "appointment_date": str(appt.appointment_date) if appt.appointment_date else None,
            "appointment_time": str(appt.appointment_time) if appt.appointment_time else None,
            "status": appt.status,
            "payment_status": appt.payment_status,
            "queue_number": appt.queue_number,
            "created_at": appt.created_at.isoformat() if appt.created_at else None,
        })

    return {
        "status": 200,
        "appointments": data,
        "count": total,
    }
