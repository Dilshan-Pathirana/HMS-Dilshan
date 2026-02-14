from __future__ import annotations

from typing import List, Optional, Dict

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

router = APIRouter()


def _full_name(first: Optional[str], last: Optional[str]) -> str:
    parts = [p for p in [(first or "").strip(), (last or "").strip()] if p]
    return " ".join(parts) if parts else "Unknown"


@router.get("/")
async def list_all_appointments(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser),
):
    # 1. Get raw count first for debug
    count_query = select(func.count(Appointment.id))
    count_result = await session.exec(count_query)
    total_raw_count = count_result.one() or 0

    # 2. Fetch all appointments without joins
    query = select(Appointment).order_by(
        col(Appointment.appointment_date).desc(),
        col(Appointment.appointment_time).desc()
    )
    result = await session.exec(query)
    appointments = result.all()

    # 3. Collect IDs
    patient_ids = {a.patient_id for a in appointments if a.patient_id}
    doctor_ids = {a.doctor_id for a in appointments if a.doctor_id}
    branch_ids = {a.branch_id for a in appointments if a.branch_id}

    # 4. Fetch related entities
    patients: Dict[str, Patient] = {}
    patient_users: Dict[str, User] = {}
    doctors: Dict[str, Doctor] = {}
    doctor_users: Dict[str, User] = {} # Doctors are users too? Check model
    branches: Dict[str, Branch] = {}

    if patient_ids:
        p_res = await session.exec(select(Patient).where(col(Patient.id).in_(patient_ids)))
        patients = {p.id: p for p in p_res.all()}
        
        # Get users for patients
        p_user_ids = {p.user_id for p in patients.values() if p.user_id}
        if p_user_ids:
            u_res = await session.exec(select(User).where(col(User.id).in_(p_user_ids)))
            patient_users = {u.id: u for u in u_res.all()}

    if doctor_ids:
        d_res = await session.exec(select(Doctor).where(col(Doctor.id).in_(doctor_ids)))
        doctors = {d.id: d for d in d_res.all()}
        # Is Doctor linked to User?
        # Typically Doctor model has user attributes directly OR a user_id
        # Checked Doctor model? I need to check if Doctor has user_id or name fields directly.
        # Assuming Doctor has first_name/last_name directly based on typical design, but I'll check.
        # If Doctor is just a profile linked to User, I need User.
        # Let's assume Doctor has fields for now, or I'll check Doctor model in next step if this fails.
        # Actually, let's fetch Doctor logic from View File of Doctor.py. 
        # But for now, I'll rely on Doctor object attributes.

    if branch_ids:
        b_res = await session.exec(select(Branch).where(col(Branch.id).in_(branch_ids)))
        branches = {b.id: b for b in b_res.all()}

    # 5. Map data
    data = []
    for appt in appointments:
        # Patient Name
        p_name = "Unknown"
        if appt.patient_id in patients:
            p = patients[appt.patient_id]
            if p.user_id in patient_users:
                u = patient_users[p.user_id]
                p_name = _full_name(u.first_name, u.last_name)

        # Doctor Name (Try Doctor fields first)
        d_name = "Unknown"
        if appt.doctor_id in doctors:
            d = doctors[appt.doctor_id]
            # Assuming Doctor has first_name/last_name. 
            # If Doctor inherits from User or has them, this works.
            # If Doctor has user_id, we might miss it.
            # Safe bet: check attributes
            fname = getattr(d, "first_name", "")
            lname = getattr(d, "last_name", "")
            d_name = _full_name(fname, lname)

        # Branch Name
        b_name = "Unknown"
        if appt.branch_id in branches:
            b_name = branches[appt.branch_id].center_name

        data.append({
            "id": appt.id,
            "patient_name": p_name,
            "patient_id": appt.patient_id,
            "doctor_name": d_name,
            "doctor_id": appt.doctor_id,
            "branch_name": b_name,
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
        "data": data,
        "count": total_raw_count,
        "debug_raw_count": total_raw_count
    }
