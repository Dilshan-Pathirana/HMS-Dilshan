"""Patient dashboard endpoints – Patch 2.4

Prefix: /api/v1/patient
~20 endpoints: stats, notifications, profile, medications, visits,
lab reports, health conditions, feedbacks, reschedule
"""
from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlmodel import select, func
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.api.deps import get_current_user
from app.models.user import User
from app.models.patient import Patient
from app.models.appointment import Appointment
from app.models.visit import Visit
from app.models.patient_dashboard import (
    HealthCondition,
    HealthConditionCreate,
    HealthConditionRead,
    Feedback,
    FeedbackCreate,
    FeedbackRead,
)

router = APIRouter()


# ---- helpers ----

async def _get_patient(session: AsyncSession, user_id: str) -> Patient:
    result = await session.exec(select(Patient).where(Patient.user_id == user_id))
    patient = result.first()
    if not patient:
        raise HTTPException(404, "Patient profile not found")
    return patient


# ============================================================
# 1. Dashboard Stats
# ============================================================

@router.get("/dashboard-stats")
async def dashboard_stats(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    patient = await _get_patient(session, current_user.id)
    today = date.today()

    upcoming = await session.exec(
        select(func.count(Appointment.id)).where(
            Appointment.patient_id == patient.id,
            Appointment.appointment_date >= today,
            Appointment.status.in_(["pending", "confirmed"]),
        )
    )
    recent_visits = await session.exec(
        select(func.count(Visit.id)).where(Visit.patient_id == patient.id)
    )
    conditions = await session.exec(
        select(func.count(HealthCondition.id)).where(
            HealthCondition.patient_id == patient.id, HealthCondition.is_active == True  # noqa
        )
    )

    return {
        "upcomingAppointments": upcoming.one() or 0,
        "recentVisits": recent_visits.one() or 0,
        "activeConditions": conditions.one() or 0,
        "unreadNotifications": 0,  # placeholder until notification system
    }


# ============================================================
# 2. Notifications (stubs until Tier 3)
# ============================================================

@router.get("/notifications/{user_id}")
async def get_notifications(
    user_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return {"notifications": []}


@router.get("/notifications/unread-count/{user_id}")
async def unread_count(
    user_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return {"count": 0}


@router.put("/notifications/{notification_id}/read")
async def mark_read(
    notification_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return {"message": "Marked as read"}


@router.put("/notifications/mark-all-read")
async def mark_all_read(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return {"message": "All marked as read"}


@router.delete("/notifications/{notification_id}")
async def delete_notification(
    notification_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return {"message": "Notification deleted"}


# ============================================================
# 3. Profile
# ============================================================

class PatientProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None


@router.put("/profile/{user_id}")
async def update_profile(
    user_id: str,
    payload: PatientProfileUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.id != user_id and current_user.role_as != 1:
        raise HTTPException(403, "Not authorized")
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")

    data = payload.model_dump(exclude_unset=True)
    if "first_name" in data:
        user.first_name = data["first_name"]
    if "last_name" in data:
        user.last_name = data["last_name"]
    if "phone" in data:
        user.contact_number_mobile = data["phone"]
    if "address" in data:
        user.home_address = data["address"]
    if "date_of_birth" in data:
        user.date_of_birth = data["date_of_birth"]
    if "gender" in data:
        user.gender = data["gender"]
    session.add(user)
    await session.commit()
    return {"message": "Profile updated"}


# ============================================================
# 4. Medications (from completed consultations — placeholder)
# ============================================================

@router.get("/medications/{user_id}")
async def get_medications(
    user_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    # Will be populated when consultation/prescription models exist (Tier 3)
    return {"medications": []}


# ============================================================
# 5. Visit History
# ============================================================

@router.get("/visits/{user_id}")
async def get_visits(
    user_id: str,
    skip: int = 0,
    limit: int = 20,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    patient = await _get_patient(session, user_id)
    result = await session.exec(
        select(Visit).where(Visit.patient_id == patient.id).offset(skip).limit(limit)
    )
    return {"visits": [v.model_dump() for v in result.all()]}


# ============================================================
# 6. Lab Reports (placeholder until Tier 3)
# ============================================================

@router.get("/lab-reports/{user_id}")
async def get_lab_reports(
    user_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return {"lab_reports": []}


# ============================================================
# 7. Health Conditions CRUD
# ============================================================

@router.get("/health-conditions", response_model=List[HealthConditionRead])
async def list_health_conditions(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    patient = await _get_patient(session, current_user.id)
    result = await session.exec(
        select(HealthCondition).where(HealthCondition.patient_id == patient.id)
    )
    return result.all()


@router.post("/health-conditions", response_model=HealthConditionRead)
async def create_health_condition(
    payload: HealthConditionCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    patient = await _get_patient(session, current_user.id)
    condition = HealthCondition(**payload.model_dump())
    condition.patient_id = patient.id
    session.add(condition)
    await session.commit()
    await session.refresh(condition)
    return condition


@router.delete("/health-conditions/{condition_id}")
async def delete_health_condition(
    condition_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    condition = await session.get(HealthCondition, condition_id)
    if not condition:
        raise HTTPException(404, "Condition not found")
    await session.delete(condition)
    await session.commit()
    return {"message": "Condition deleted"}


# ============================================================
# 8. Feedback
# ============================================================

@router.get("/my-feedbacks", response_model=List[FeedbackRead])
async def my_feedbacks(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    result = await session.exec(
        select(Feedback).where(Feedback.user_id == current_user.id)
    )
    return result.all()
