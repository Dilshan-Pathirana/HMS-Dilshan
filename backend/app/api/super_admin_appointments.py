"""Super-admin appointment endpoints.

Prefix: /api/v1/super-admin/appointments

These endpoints provide a comprehensive view of all appointments in the system.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends
from sqlmodel import select, col
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.deps import get_current_active_superuser
from app.core.database import get_session
from app.models.appointment import Appointment
from app.models.branch import Branch
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.user import User

router = APIRouter()


def _full_name(first_name: Optional[str], last_name: Optional[str]) -> str:
    return " ".join([p for p in [(first_name or "").strip(), (last_name or "").strip()] if p]).strip()


@router.get("/")
async def list_all_appointments(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser),
):
    """
    Fetch ALL appointments with details.
    Ordered by date (descending) and time (descending).
    """
    # Join with Patient, Doctor, and Branch to get names
    query = (
        select(
            Appointment,
            Patient,
            User,  # User associated with Patient for name
            Doctor,
            Branch
        )
        .join(Patient, Appointment.patient_id == Patient.id, isouter=True)
        .join(User, Patient.user_id == User.id, isouter=True)
        .join(Doctor, Appointment.doctor_id == Doctor.id, isouter=True)
        .join(Branch, Appointment.branch_id == Branch.id, isouter=True)
        .order_by(col(Appointment.appointment_date).desc(), col(Appointment.appointment_time).desc())
    )

    result = await session.exec(query)
    rows = result.all()

    appointments_list = []
    for row in rows:
        # row is a tuple: (Appointment, Patient, User, Doctor, Branch)
        # Note: Some joins might be None if isouter=True and no match found (though unlikely for valid data)
        appt, patient, patient_user, doctor, branch = row

        patient_name = "Unknown"
        if patient_user:
            patient_name = _full_name(patient_user.first_name, patient_user.last_name)

        doctor_name = "Unknown"
        if doctor:
            doctor_name = _full_name(doctor.first_name, doctor.last_name)

        branch_name = branch.center_name if branch else "Unknown"

        appointments_list.append({
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
        "data": appointments_list,
        "count": len(appointments_list)
    }
