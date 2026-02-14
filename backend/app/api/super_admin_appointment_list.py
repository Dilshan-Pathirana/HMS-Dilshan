from __future__ import annotations

from typing import Optional, Dict, List

from fastapi import APIRouter, Depends
from sqlmodel import select, col, func
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.deps import get_current_active_superuser
from app.core.database import get_session
from app.models.appointment import Appointment
from app.models.branch import Branch
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.user import User

# Adjusted to avoid double prefix since main.py already includes with prefix
router = APIRouter()


def _full_name(first: Optional[str], last: Optional[str]) -> str:
    parts = [p for p in [(first or "").strip(), (last or "").strip()] if p]
    return " ".join(parts) if parts else "Unknown"


@router.get("/appointment-list")
async def list_all_appointments_for_super_admin(
    skip: int = 0,
    limit: int = 500,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser),
):
    """
    Super admin endpoint to list all appointments.
    Returns ALL appointments in system with patient details.
    """

    # Get total count
    total_query = select(func.count(Appointment.id))
    total_result = await session.exec(total_query)
    total = total_result.one()

    # Fetch appointments ordered by date desc
    query = (
        select(Appointment)
        .order_by(
            col(Appointment.appointment_date).desc(),
            col(Appointment.appointment_time).desc(),
        )
        .offset(skip)
        .limit(limit)
    )
    appointments_result = await session.exec(query)
    appointments: List[Appointment] = appointments_result.all()

    # Collect IDs for related data
    patient_ids = {a.patient_id for a in appointments if a.patient_id}
    doctor_ids = {a.doctor_id for a in appointments if a.doctor_id}
    branch_ids = {a.branch_id for a in appointments if a.branch_id}

    # Fetch patients
    patients: Dict[str, Patient] = {}
    patient_users: Dict[str, User] = {}
    if patient_ids:
        patient_query = select(Patient).where(col(Patient.id).in_(patient_ids))
        patient_result = await session.exec(patient_query)
        patients = {p.id: p for p in patient_result.all()}

        user_ids = {p.user_id for p in patients.values() if p.user_id}
        if user_ids:
            user_query = select(User).where(col(User.id).in_(user_ids))
            user_result = await session.exec(user_query)
            patient_users = {u.id: u for u in user_result.all()}

    # Fetch doctors
    doctors: Dict[str, Doctor] = {}
    doctor_users: Dict[str, User] = {}
    if doctor_ids:
        doctor_query = select(Doctor).where(col(Doctor.id).in_(doctor_ids))
        doctor_result = await session.exec(doctor_query)
        doctors = {d.id: d for d in doctor_result.all()}

        user_ids = {d.user_id for d in doctors.values() if d.user_id}
        if user_ids:
            user_query = select(User).where(col(User.id).in_(user_ids))
            user_result = await session.exec(user_query)
            doctor_users = {u.id: u for u in user_result.all()}

    # Fetch branches
    branches: Dict[str, Branch] = {}
    if branch_ids:
        branch_query = select(Branch).where(col(Branch.id).in_(branch_ids))
        branch_result = await session.exec(branch_query)
        branches = {b.id: b for b in branch_result.all()}

    # Build response data
    data = []
    for appt in appointments:
        # Patient name
        patient_name = "Unknown"
        if appt.patient_id in patients:
            p = patients[appt.patient_id]
            if p.user_id in patient_users:
                u = patient_users[p.user_id]
                patient_name = _full_name(u.first_name, u.last_name)

        # Doctor name
        doctor_name = "Unknown"
        if appt.doctor_id in doctors:
            d = doctors[appt.doctor_id]
            if d.user_id in doctor_users:
                u = doctor_users[d.user_id]
                doctor_name = _full_name(u.first_name, u.last_name)

        # Branch name
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
