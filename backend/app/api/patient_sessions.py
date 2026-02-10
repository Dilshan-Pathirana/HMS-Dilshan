from __future__ import annotations

from datetime import date, time, datetime
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlmodel import select, col
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_session
from app.models.user import User
from app.models.branch import Branch
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.appointment import Appointment
from app.models.doctor_main_question import DoctorMainQuestion, DoctorMainQuestionAnswer
from app.models.patient_session import (
    ScheduleSession,
    PatientProfile,
    PatientSession,
    PatientQuestionAnswer,
)
from app.services.appointment_service import AppointmentService

router = APIRouter()


class SessionListItem(BaseModel):
    id: str
    session_date: date
    start_time: time
    end_time: time
    doctor_id: str
    doctor_name: str
    branch_id: str
    branch_name: str
    appointment_count: int
    status: str


class SessionDetail(BaseModel):
    id: str
    schedule_id: Optional[str] = None
    session_date: date
    start_time: time
    end_time: time
    doctor_id: str
    doctor_name: str
    branch_id: str
    branch_name: str
    appointment_count: int
    status: str


class SessionPatientItem(BaseModel):
    appointment_id: str
    appointment_time: time
    status: str
    patient_id: str
    patient_name: str


class IntakeAnswer(BaseModel):
    question_id: str
    answer_text: str


class IntakePayload(BaseModel):
    appointment_id: str
    schedule_session_id: Optional[str] = None
    sex: Optional[str] = None
    age: Optional[int] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    notes: Optional[str] = None
    answers: List[IntakeAnswer] = []


class QuestionAnswerOption(BaseModel):
    id: str
    answer: str


class QuestionItem(BaseModel):
    id: str
    question: str
    description: str
    category: Optional[str] = None
    order: int
    status: int
    answers: List[QuestionAnswerOption]


class QuestionCreatePayload(BaseModel):
    question: str
    description: Optional[str] = ""
    category: Optional[str] = None
    order: Optional[int] = 0
    status: Optional[int] = 1
    answers: List[str] = []
    attach_patient_id: Optional[str] = None
    attach_answer_text: Optional[str] = None
    attach_session_id: Optional[str] = None
    attach_appointment_id: Optional[str] = None


def _full_name(first: Optional[str], last: Optional[str]) -> str:
    return " ".join([p for p in [(first or "").strip(), (last or "").strip()] if p]).strip()


async def _doctor_for_user(session: AsyncSession, user_id: str) -> Optional[Doctor]:
    result = await session.exec(select(Doctor).where(Doctor.user_id == user_id))
    return result.first()


def _require_roles(current_user: User, allowed: List[int]) -> None:
    if current_user.role_as not in allowed:
        raise HTTPException(status_code=403, detail="Not enough privileges")


async def _ensure_session_access(
    session: AsyncSession,
    current_user: User,
    schedule_session: ScheduleSession,
) -> None:
    if current_user.role_as == 1:
        return
    if current_user.role_as in (2, 4):
        if not current_user.branch_id or current_user.branch_id != schedule_session.branch_id:
            raise HTTPException(status_code=403, detail="Not enough privileges")
        return
    if current_user.role_as == 3:
        doctor = await _doctor_for_user(session, current_user.id)
        if not doctor or doctor.id != schedule_session.doctor_id:
            raise HTTPException(status_code=403, detail="Not enough privileges")
        return
    raise HTTPException(status_code=403, detail="Not enough privileges")


@router.get("/sessions", response_model=List[SessionListItem])
async def list_sessions(
    branch_id: Optional[str] = None,
    doctor_id: Optional[str] = None,
    session_date: Optional[date] = Query(default=None),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    _require_roles(current_user, [1, 2, 3, 4])
    if current_user.role_as == 2 or current_user.role_as == 4:
        branch_id = current_user.branch_id
    if current_user.role_as == 3:
        doctor = await _doctor_for_user(session, current_user.id)
        if not doctor:
            return []
        doctor_id = doctor.id

    appt_q = select(Appointment).where(Appointment.status != "cancelled")
    if branch_id:
        appt_q = appt_q.where(Appointment.branch_id == branch_id)
    if doctor_id:
        appt_q = appt_q.where(Appointment.doctor_id == doctor_id)
    if session_date:
        appt_q = appt_q.where(Appointment.appointment_date == session_date)

    appt_res = await session.exec(appt_q)
    appts = appt_res.all() or []

    changed = False
    session_ids: List[str] = []
    for appt in appts:
        if not appt.schedule_session_id:
            schedule_session = await AppointmentService._get_or_create_schedule_session(
                session,
                appt.doctor_id,
                appt.branch_id,
                appt.appointment_date,
                appt.appointment_time,
                current_user.id,
            )
            appt.schedule_id = schedule_session.schedule_id
            appt.schedule_session_id = schedule_session.id
            session.add(appt)
            changed = True
        if appt.schedule_session_id:
            session_ids.append(appt.schedule_session_id)

    if changed:
        await session.commit()

    if not session_ids:
        return []

    session_ids = list({sid for sid in session_ids})

    sessions_res = await session.exec(
        select(ScheduleSession).where(col(ScheduleSession.id).in_(session_ids))
    )
    sessions = sessions_res.all() or []

    doctor_ids = {s.doctor_id for s in sessions}
    branch_ids = {s.branch_id for s in sessions}

    doctor_map: Dict[str, Doctor] = {}
    branch_map: Dict[str, Branch] = {}
    if doctor_ids:
        doctor_res = await session.exec(select(Doctor).where(col(Doctor.id).in_(doctor_ids)))
        doctor_map = {d.id: d for d in doctor_res.all()}
    if branch_ids:
        branch_res = await session.exec(select(Branch).where(col(Branch.id).in_(branch_ids)))
        branch_map = {b.id: b for b in branch_res.all()}

    appt_counts: Dict[str, int] = {}
    for appt in appts:
        if appt.schedule_session_id:
            appt_counts[appt.schedule_session_id] = appt_counts.get(appt.schedule_session_id, 0) + 1

    items: List[SessionListItem] = []
    for s in sessions:
        doc = doctor_map.get(s.doctor_id)
        brn = branch_map.get(s.branch_id)
        items.append(
            SessionListItem(
                id=s.id,
                session_date=s.session_date,
                start_time=s.start_time,
                end_time=s.end_time,
                doctor_id=s.doctor_id,
                doctor_name=_full_name(doc.first_name, doc.last_name) if doc else s.doctor_id,
                branch_id=s.branch_id,
                branch_name=brn.center_name if brn else s.branch_id,
                appointment_count=appt_counts.get(s.id, 0),
                status=s.status,
            )
        )

    items.sort(key=lambda i: (i.session_date, i.start_time))
    return items


@router.get("/sessions/{session_id}", response_model=SessionDetail)
async def get_session_detail(
    session_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    schedule_session = await session.get(ScheduleSession, session_id)
    if not schedule_session:
        raise HTTPException(status_code=404, detail="Session not found")

    await _ensure_session_access(session, current_user, schedule_session)

    appt_count = await session.exec(
        select(col(Appointment.id))
        .where(Appointment.schedule_session_id == session_id)
    )
    appt_total = len(appt_count.all() or [])

    doctor = await session.get(Doctor, schedule_session.doctor_id)
    branch = await session.get(Branch, schedule_session.branch_id)

    return SessionDetail(
        id=schedule_session.id,
        schedule_id=schedule_session.schedule_id,
        session_date=schedule_session.session_date,
        start_time=schedule_session.start_time,
        end_time=schedule_session.end_time,
        doctor_id=schedule_session.doctor_id,
        doctor_name=_full_name(doctor.first_name, doctor.last_name) if doctor else schedule_session.doctor_id,
        branch_id=schedule_session.branch_id,
        branch_name=branch.center_name if branch else schedule_session.branch_id,
        appointment_count=appt_total,
        status=schedule_session.status,
    )


@router.get("/sessions/{session_id}/patients", response_model=List[SessionPatientItem])
async def list_session_patients(
    session_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    schedule_session = await session.get(ScheduleSession, session_id)
    if not schedule_session:
        raise HTTPException(status_code=404, detail="Session not found")

    await _ensure_session_access(session, current_user, schedule_session)

    appt_res = await session.exec(
        select(Appointment)
        .where(Appointment.schedule_session_id == session_id)
        .order_by(col(Appointment.appointment_time))
    )
    appts = appt_res.all() or []
    if not appts:
        return []

    patient_ids = {a.patient_id for a in appts}
    patient_res = await session.exec(select(Patient).where(col(Patient.id).in_(patient_ids)))
    patients = patient_res.all() or []
    user_ids = {p.user_id for p in patients}

    user_map: Dict[str, User] = {}
    if user_ids:
        user_res = await session.exec(select(User).where(col(User.id).in_(user_ids)))
        user_map = {u.id: u for u in user_res.all()}

    patient_map: Dict[str, Patient] = {p.id: p for p in patients}

    items: List[SessionPatientItem] = []
    for appt in appts:
        patient = patient_map.get(appt.patient_id)
        user = user_map.get(patient.user_id) if patient else None
        items.append(
            SessionPatientItem(
                appointment_id=appt.id,
                appointment_time=appt.appointment_time,
                status=appt.status,
                patient_id=appt.patient_id,
                patient_name=_full_name(user.first_name, user.last_name) if user else appt.patient_id,
            )
        )
    return items


@router.post("/patient-session/intake")
async def submit_intake(
    payload: IntakePayload,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    _require_roles(current_user, [1, 2, 3, 4])

    appt = await session.get(Appointment, payload.appointment_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    schedule_session_id = payload.schedule_session_id or appt.schedule_session_id
    if not schedule_session_id:
        schedule_session = await AppointmentService._get_or_create_schedule_session(
            session,
            appt.doctor_id,
            appt.branch_id,
            appt.appointment_date,
            appt.appointment_time,
            current_user.id,
        )
        schedule_session_id = schedule_session.id
        appt.schedule_id = schedule_session.schedule_id
        appt.schedule_session_id = schedule_session.id
        session.add(appt)

    profile_res = await session.exec(
        select(PatientProfile).where(PatientProfile.patient_id == appt.patient_id)
    )
    profile = profile_res.first()
    if not profile:
        profile = PatientProfile(
            patient_id=appt.patient_id,
            sex=payload.sex,
            age=payload.age,
            height_cm=payload.height_cm,
            weight_kg=payload.weight_kg,
            created_by=current_user.id,
        )
        session.add(profile)
        await session.flush()
    else:
        if payload.sex is not None:
            profile.sex = payload.sex
        if payload.age is not None:
            profile.age = payload.age
        if payload.height_cm is not None:
            profile.height_cm = payload.height_cm
        if payload.weight_kg is not None:
            profile.weight_kg = payload.weight_kg
        profile.updated_at = datetime.utcnow()
        session.add(profile)

    ps_res = await session.exec(
        select(PatientSession).where(PatientSession.appointment_id == appt.id)
    )
    patient_session = ps_res.first()
    if not patient_session:
        patient_session = PatientSession(
            appointment_id=appt.id,
            schedule_session_id=schedule_session_id,
            patient_id=appt.patient_id,
            doctor_id=appt.doctor_id,
            branch_id=appt.branch_id,
            intake_status="completed",
            sex=payload.sex,
            age=payload.age,
            height_cm=payload.height_cm,
            weight_kg=payload.weight_kg,
            notes=payload.notes,
            created_by=current_user.id,
        )
    else:
        patient_session.schedule_session_id = schedule_session_id
        patient_session.intake_status = "completed"
        patient_session.sex = payload.sex
        patient_session.age = payload.age
        patient_session.height_cm = payload.height_cm
        patient_session.weight_kg = payload.weight_kg
        patient_session.notes = payload.notes
        patient_session.updated_at = patient_session.updated_at or patient_session.created_at
    session.add(patient_session)
    await session.flush()

    for answer in payload.answers:
        qa = PatientQuestionAnswer(
            patient_profile_id=profile.id,
            patient_id=appt.patient_id,
            question_id=answer.question_id,
            answer_text=answer.answer_text,
            created_by=current_user.id,
            session_id=patient_session.id,
            appointment_id=appt.id,
        )
        session.add(qa)

    await session.commit()

    return {"status": 200, "message": "Intake saved", "patient_session_id": patient_session.id}


@router.get("/questions", response_model=List[QuestionItem])
async def list_questions(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    q_res = await session.exec(select(DoctorMainQuestion).order_by(col(DoctorMainQuestion.order)))
    questions = q_res.all() or []

    if not questions:
        return []

    q_ids = [q.id for q in questions]
    ans_res = await session.exec(
        select(DoctorMainQuestionAnswer).where(col(DoctorMainQuestionAnswer.question_id).in_(q_ids))
    )
    answers = ans_res.all() or []

    answers_map: Dict[str, List[QuestionAnswerOption]] = {}
    for ans in answers:
        answers_map.setdefault(ans.question_id, []).append(
            QuestionAnswerOption(id=ans.id, answer=ans.answer)
        )

    return [
        QuestionItem(
            id=q.id,
            question=q.question,
            description=q.description,
            category=q.category,
            order=q.order,
            status=q.status,
            answers=answers_map.get(q.id, []),
        )
        for q in questions
    ]


@router.post("/questions")
async def create_question(
    payload: QuestionCreatePayload,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    _require_roles(current_user, [1, 3])

    question = DoctorMainQuestion(
        doctor_id=current_user.id,
        question=payload.question,
        category=payload.category,
        description=payload.description or "",
        order=payload.order or 0,
        status=payload.status or 1,
    )
    session.add(question)
    await session.flush()

    for ans in payload.answers:
        session.add(DoctorMainQuestionAnswer(question_id=question.id, answer=ans))

    if payload.attach_patient_id and payload.attach_answer_text:
        profile_res = await session.exec(
            select(PatientProfile).where(PatientProfile.patient_id == payload.attach_patient_id)
        )
        profile = profile_res.first()
        if not profile:
            profile = PatientProfile(
                patient_id=payload.attach_patient_id,
                created_by=current_user.id,
            )
            session.add(profile)
            await session.flush()

        session.add(
            PatientQuestionAnswer(
                patient_profile_id=profile.id,
                patient_id=payload.attach_patient_id,
                question_id=question.id,
                answer_text=payload.attach_answer_text,
                created_by=current_user.id,
                session_id=payload.attach_session_id,
                appointment_id=payload.attach_appointment_id,
            )
        )

    await session.commit()
    await session.refresh(question)

    return {"status": 200, "question_id": question.id}
