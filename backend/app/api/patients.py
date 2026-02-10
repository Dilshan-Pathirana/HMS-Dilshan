from typing import List, Optional
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from sqlalchemy.orm import selectinload

from app.core.database import get_session
from app.models.patient import Patient, PatientCreate, PatientRead
from app.models.user import User
from app.api.deps import get_current_active_superuser, get_current_user
from app.models.appointment import Appointment
from app.models.doctor import Doctor
from app.models.doctor_main_question import DoctorMainQuestion
from app.models.patient_session import PatientProfile, PatientQuestionAnswer

router = APIRouter()

@router.post("/", response_model=PatientRead)
async def create_patient(
    patient_in: PatientCreate,
    current_user: User = Depends(get_current_active_superuser),
    session: AsyncSession = Depends(get_session)
):
    # Verify user exists
    user = await session.get(User, patient_in.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    query = select(Patient).where(Patient.user_id == patient_in.user_id)
    result = await session.exec(query)
    if result.first():
         raise HTTPException(status_code=400, detail="Patient profile already exists for this user")

    patient = Patient.model_validate(patient_in)
    session.add(patient)
    await session.commit()
    await session.refresh(patient)
    patient.user = user
    return patient

@router.get("/", response_model=None)
async def read_patients(
    skip: int = 0,
    limit: int = 100,
    name: Optional[str] = None,
    branch_id: Optional[str] = None,
    doctor_id: Optional[str] = None,
    appt_date: Optional[date] = Query(default=None, alias="date"),
    include_profile: bool = False,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role_as == 5:
        # Patient can only see their own profile.
        result = await session.exec(
            select(Patient)
            .options(selectinload(Patient.user))
            .where(Patient.user_id == current_user.id)
        )
        patient = result.first()
        if not patient:
            return []
        payload = patient.model_dump()
        payload["user"] = patient.user.model_dump() if patient.user else None
        if include_profile:
            prof_res = await session.exec(
                select(PatientProfile).where(PatientProfile.patient_id == patient.id)
            )
            profile = prof_res.first()
            payload["patient_profile"] = profile.model_dump() if profile else None
        return [payload]

    if current_user.role_as in (2, 4):
        branch_id = current_user.branch_id
    if current_user.role_as == 3:
        doctor = await session.exec(select(Doctor).where(Doctor.user_id == current_user.id))
        doctor_row = doctor.first()
        doctor_id = doctor_row.id if doctor_row else None

    patient_ids: Optional[List[str]] = None
    if branch_id or doctor_id or appt_date:
        appt_q = select(Appointment.patient_id).distinct()
        if branch_id:
            appt_q = appt_q.where(Appointment.branch_id == branch_id)
        if doctor_id:
            appt_q = appt_q.where(Appointment.doctor_id == doctor_id)
        if appt_date:
            appt_q = appt_q.where(Appointment.appointment_date == appt_date)
        appt_res = await session.exec(appt_q)
        patient_ids = list({pid for pid in appt_res.all() or []})
        if not patient_ids:
            return []

    query = select(Patient).options(selectinload(Patient.user))
    if patient_ids is not None:
        query = query.where(Patient.id.in_(patient_ids))

    query = query.offset(skip).limit(limit)
    result = await session.exec(query)
    patients = result.all() or []

    if name:
        needle = name.strip().lower()
        patients = [
            p for p in patients
            if (
                (p.user and (p.user.first_name or "").lower().find(needle) >= 0)
                or (p.user and (p.user.last_name or "").lower().find(needle) >= 0)
                or (p.user and (f"{p.user.first_name} {p.user.last_name}".strip().lower().find(needle) >= 0))
            )
        ]

    profile_map = {}
    if include_profile and patients:
        prof_res = await session.exec(
            select(PatientProfile).where(PatientProfile.patient_id.in_([p.id for p in patients]))
        )
        profile_map = {p.patient_id: p for p in prof_res.all() or []}

    payload = []
    for patient in patients:
        item = patient.model_dump()
        item["user"] = patient.user.model_dump() if patient.user else None
        if include_profile:
            profile = profile_map.get(patient.id)
            item["patient_profile"] = profile.model_dump() if profile else None
        payload.append(item)

    return payload

@router.get("/me", response_model=None)
async def read_my_patient_profile(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role_as != 5:
        raise HTTPException(status_code=403, detail="Not enough privileges")
    result = await session.exec(
        select(Patient).options(selectinload(Patient.user)).where(Patient.user_id == current_user.id)
    )
    patient = result.first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    payload = patient.model_dump()
    payload["user"] = patient.user.model_dump() if patient.user else None
    return payload


@router.get("/{patient_id}", response_model=None)
async def read_patient(
    patient_id: str,
    session: AsyncSession = Depends(get_session),
    include_profile: bool = False,
    current_user: User = Depends(get_current_user),
):
    query = select(Patient).options(selectinload(Patient.user)).where(Patient.id == patient_id)
    result = await session.exec(query)
    patient = result.first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    if current_user.role_as == 5 and patient.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough privileges")
    if current_user.role_as in (2, 4) and current_user.branch_id:
        appt_res = await session.exec(
            select(Appointment)
            .where(Appointment.patient_id == patient.id, Appointment.branch_id == current_user.branch_id)
            .limit(1)
        )
        if not appt_res.first():
            raise HTTPException(status_code=403, detail="Not enough privileges")
    if current_user.role_as == 3:
        doctor_res = await session.exec(select(Doctor).where(Doctor.user_id == current_user.id))
        doctor = doctor_res.first()
        if not doctor:
            raise HTTPException(status_code=403, detail="Not enough privileges")
        appt_res = await session.exec(
            select(Appointment)
            .where(Appointment.patient_id == patient.id, Appointment.doctor_id == doctor.id)
            .limit(1)
        )
        if not appt_res.first():
            raise HTTPException(status_code=403, detail="Not enough privileges")

    payload = patient.model_dump()
    payload["user"] = patient.user.model_dump() if patient.user else None

    if include_profile:
        prof_res = await session.exec(
            select(PatientProfile).where(PatientProfile.patient_id == patient.id)
        )
        profile = prof_res.first()
        payload["patient_profile"] = profile.model_dump() if profile else None

        qa_res = await session.exec(
            select(PatientQuestionAnswer)
            .where(PatientQuestionAnswer.patient_id == patient.id)
            .order_by(PatientQuestionAnswer.created_at.desc())
        )
        qa_items = qa_res.all() or []
        question_ids = {q.question_id for q in qa_items}
        user_ids = {q.created_by for q in qa_items if q.created_by}

        questions_map = {}
        users_map = {}
        if question_ids:
            q_res = await session.exec(select(DoctorMainQuestion).where(DoctorMainQuestion.id.in_(question_ids)))
            questions_map = {q.id: q for q in q_res.all() or []}
        if user_ids:
            u_res = await session.exec(select(User).where(User.id.in_(user_ids)))
            users_map = {u.id: u for u in u_res.all() or []}

        qa_payload = []
        for qa in qa_items:
            question = questions_map.get(qa.question_id)
            user = users_map.get(qa.created_by) if qa.created_by else None
            qa_payload.append(
                {
                    "id": qa.id,
                    "question_id": qa.question_id,
                    "question": question.question if question else "",
                    "answer": qa.answer_text,
                    "created_by": f"{user.first_name} {user.last_name}".strip() if user else None,
                    "created_at": qa.created_at,
                    "session_id": qa.session_id,
                    "appointment_id": qa.appointment_id,
                }
            )
        payload["qa_history"] = qa_payload

    return payload


class PatientQAItem(BaseModel):
    question_id: str
    answer_text: str
    session_id: Optional[str] = None
    appointment_id: Optional[str] = None


class PatientProfileUpdate(BaseModel):
    sex: Optional[str] = None
    age: Optional[int] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None


@router.put("/{patient_id}/profile")
async def update_patient_profile(
    patient_id: str,
    payload: PatientProfileUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role_as not in (1, 3):
        raise HTTPException(status_code=403, detail="Not enough privileges")

    patient = await session.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    prof_res = await session.exec(select(PatientProfile).where(PatientProfile.patient_id == patient_id))
    profile = prof_res.first()
    if not profile:
        profile = PatientProfile(patient_id=patient_id, created_by=current_user.id)
        session.add(profile)
        await session.flush()

    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(profile, key, value)
    profile.updated_at = datetime.utcnow()
    session.add(profile)
    await session.commit()
    return {"status": 200, "message": "Profile updated"}


@router.post("/{patient_id}/qa")
async def add_patient_qa(
    patient_id: str,
    items: List[PatientQAItem],
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role_as not in (1, 2, 3, 4):
        raise HTTPException(status_code=403, detail="Not enough privileges")

    patient = await session.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    prof_res = await session.exec(select(PatientProfile).where(PatientProfile.patient_id == patient_id))
    profile = prof_res.first()
    if not profile:
        profile = PatientProfile(patient_id=patient_id, created_by=current_user.id)
        session.add(profile)
        await session.flush()

    for item in items:
        qa = PatientQuestionAnswer(
            patient_profile_id=profile.id,
            patient_id=patient_id,
            question_id=item.question_id,
            answer_text=item.answer_text,
            created_by=current_user.id,
            session_id=item.session_id,
            appointment_id=item.appointment_id,
        )
        session.add(qa)

    await session.commit()
    return {"status": 200, "message": "Q&A added"}
