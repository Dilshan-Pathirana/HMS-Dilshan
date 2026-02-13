from __future__ import annotations

from datetime import date, time, datetime, timedelta
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field as PydanticField
from sqlmodel import select, col, delete
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func, or_
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_session
from app.core.security import get_password_hash
from app.models.user import User
from app.models.branch import Branch
from app.models.doctor import Doctor
from app.models.doctor_schedule import DoctorSchedule
from app.models.patient import Patient
from app.models.appointment import Appointment
from app.models.doctor_main_question import DoctorMainQuestion, DoctorMainQuestionAnswer
from app.models.patient_session import (
    ScheduleSession,
    PatientProfile,
    PatientSession,
    PatientQuestionAnswer,
    SessionStaff,
    SessionQueue,
    SessionIntake,
)
from app.services.appointment_service import AppointmentService
from app.services.doctor_schedule_service import DoctorScheduleService

router = APIRouter()


class SessionPatientBrief(BaseModel):
    patient_id: str
    first_name: str
    last_name: str
    contact_number: Optional[str] = None


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
    total_slots: int = 0
    assigned_staff_count: int = 0
    status: str
    patients: List[SessionPatientBrief] = []


class SessionQueueStatus(BaseModel):
    current_doctor_slot: int
    current_nurse_slot: int
    status: str

class NurseItem(BaseModel):
    id: str
    name: str

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
    assigned_nurses: List[NurseItem] = []
    queue_status: Optional[SessionQueueStatus] = None


class SessionCreatePayload(BaseModel):
    branch_id: str
    doctor_id: str
    start_time: time
    end_time: time
    slot_duration_minutes: int = PydanticField(ge=5, le=240)
    max_patients: int = PydanticField(ge=1)
    recurrence_type: str = "weekly"
    status: Optional[str] = "active"
    valid_from: Optional[date] = None
    valid_until: Optional[date] = None


class SessionPatientItem(BaseModel):
    appointment_id: str
    appointment_time: time
    status: str
    patient_id: str
    patient_name: str
    slot_index: Optional[int] = None


class SessionSlotItem(BaseModel):
    slot_index: int
    slot_time: str
    appointment_id: Optional[str] = None
    patient_id: Optional[str] = None
    patient_name: Optional[str] = None
    status: Optional[str] = None
    is_current_with_doctor: bool = False
    is_current_with_nurse: bool = False


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
    expected_patient_session_updated_at: Optional[str] = None
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


def _time_to_minutes(value: time) -> int:
    return value.hour * 60 + value.minute


def _build_slot_times(start_time: time, end_time: time, slot_duration: int, max_patients: int) -> List[time]:
    if slot_duration <= 0:
        slot_duration = 15
    start_minutes = _time_to_minutes(start_time)
    end_minutes = _time_to_minutes(end_time)
    if end_minutes <= start_minutes:
        return []

    slots: List[time] = []
    cursor = start_minutes
    while cursor < end_minutes:
        hour = cursor // 60
        minute = cursor % 60
        slots.append(time(hour=hour, minute=minute))
        cursor += slot_duration

    if max_patients > 0:
        return slots[:max_patients]
    return slots


async def _get_session_slot_config(db: AsyncSession, schedule_session: ScheduleSession) -> tuple[int, int]:
    slot_duration = 15
    max_patients = 0
    if schedule_session.schedule_id:
        schedule = await db.get(DoctorSchedule, schedule_session.schedule_id)
        if schedule:
            slot_duration = schedule.slot_duration_minutes or slot_duration
            max_patients = schedule.max_patients or max_patients

    if max_patients <= 0:
        derived_slots = _build_slot_times(schedule_session.start_time, schedule_session.end_time, slot_duration, 0)
        max_patients = len(derived_slots)

    return slot_duration, max_patients


async def _doctor_for_user(session: AsyncSession, user_id: str) -> Optional[Doctor]:
    result = await session.exec(select(Doctor).where(Doctor.user_id == user_id))
    return result.first()


def _require_roles(current_user: User, allowed: List[int]) -> None:
    if current_user.role_as not in allowed:
        raise HTTPException(status_code=403, detail="Not enough privileges")


@router.post("/sessions", response_model=SessionDetail, status_code=200)
async def create_schedule_session(
    payload: SessionCreatePayload,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    _require_roles(current_user, [1, 2, 3])

    doctor = await session.get(Doctor, payload.doctor_id)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    branch = await session.get(Branch, payload.branch_id)
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")

    if payload.end_time <= payload.start_time:
        raise HTTPException(status_code=422, detail="End time must be after start time")

    recurrence_raw = (payload.recurrence_type or "weekly").strip().lower()
    recurrence_key = recurrence_raw.replace("-", " ").replace("_", " ")
    if recurrence_key in ("bi weekly", "biweekly"):
        recurrence_type = "biweekly"
    elif recurrence_key in ("daily", "everyday"):
        recurrence_type = "daily"
    elif recurrence_key in ("once", "one time"):
        recurrence_type = "once"
    else:
        recurrence_type = "weekly"

    day_source = payload.valid_from or date.today()
    day_of_week = day_source.weekday()

    days_to_create = list(range(7)) if recurrence_type == "daily" else [day_of_week]
    stored_recurrence = "weekly" if recurrence_type == "daily" else recurrence_type

    created_schedule: Optional[DoctorSchedule] = None
    for day in days_to_create:
        data = {
            "doctor_id": payload.doctor_id,
            "branch_id": payload.branch_id,
            "day_of_week": day,
            "start_time": payload.start_time,
            "end_time": payload.end_time,
            "slot_duration_minutes": payload.slot_duration_minutes,
            "max_patients": payload.max_patients,
            "status": payload.status or "active",
            "recurrence_type": stored_recurrence,
            "valid_from": payload.valid_from,
            "valid_until": payload.valid_until,
        }
        try:
            created = await DoctorScheduleService.create_schedule(session, data)
            if created_schedule is None:
                created_schedule = created
        except HTTPException:
            raise
        except IntegrityError:
            await session.rollback()
            raise HTTPException(status_code=409, detail="Schedule already exists")

    if not created_schedule:
        raise HTTPException(status_code=500, detail="Failed to create session")

    return SessionDetail(
        id=created_schedule.id,
        schedule_id=created_schedule.id,
        session_date=payload.valid_from or date.today(),
        start_time=created_schedule.start_time,
        end_time=created_schedule.end_time,
        doctor_id=created_schedule.doctor_id,
        doctor_name=f"Dr. {_full_name(doctor.first_name, doctor.last_name)}",
        branch_id=created_schedule.branch_id,
        branch_name=branch.center_name,
        appointment_count=0,
        status=created_schedule.status,
    )


async def _ensure_session_access(
    session: AsyncSession,
    current_user: User,
    schedule_session: ScheduleSession,
) -> None:
    if current_user.role_as == 1:
        return
    if current_user.role_as == 2:
        if not current_user.branch_id or current_user.branch_id != schedule_session.branch_id:
            raise HTTPException(status_code=403, detail="Not enough privileges")
        return
    if current_user.role_as == 4:
        assignment_res = await session.exec(
            select(SessionStaff).where(
                SessionStaff.schedule_session_id == schedule_session.id,
                SessionStaff.staff_id == current_user.id,
                SessionStaff.role == "nurse",
            )
        )
        if not assignment_res.first():
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
    try:
        _require_roles(current_user, [1, 2, 3])
        if current_user.role_as == 2:
            branch_id = current_user.branch_id
        if current_user.role_as == 3:
            doctor = await _doctor_for_user(session, current_user.id)
            if not doctor:
                return []
            doctor_id = doctor.id

        sessions_q = select(ScheduleSession)
        if branch_id:
            sessions_q = sessions_q.where(ScheduleSession.branch_id == branch_id)
        if doctor_id:
            sessions_q = sessions_q.where(ScheduleSession.doctor_id == doctor_id)
        if session_date:
            sessions_q = sessions_q.where(ScheduleSession.session_date == session_date)

        sessions_res = await session.exec(
            sessions_q.order_by(col(ScheduleSession.session_date), col(ScheduleSession.start_time))
        )
        sessions = sessions_res.all() or []
        if not sessions:
            return []

        session_ids = [s.id for s in sessions]

        appts_res = await session.exec(
            select(Appointment).where(
                col(Appointment.schedule_session_id).in_(session_ids),
                Appointment.status != "cancelled",
            )
        )
        appts = appts_res.all() or []

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
        session_patient_ids: Dict[str, List[str]] = {}  # session_id -> [patient_id, ...]
        for appt in appts:
            if appt.schedule_session_id:
                appt_counts[appt.schedule_session_id] = appt_counts.get(appt.schedule_session_id, 0) + 1
                session_patient_ids.setdefault(appt.schedule_session_id, []).append(appt.patient_id)

        assigned_counts: Dict[str, int] = {}
        if session_ids:
            assigned_rows = await session.exec(
                select(SessionStaff.schedule_session_id, func.count(SessionStaff.id))
                .where(
                    col(SessionStaff.schedule_session_id).in_(session_ids),
                    SessionStaff.role == "nurse",
                )
                .group_by(SessionStaff.schedule_session_id)
            )
            for schedule_session_id, count in assigned_rows.all() or []:
                assigned_counts[schedule_session_id] = int(count or 0)

        # Fetch patient + user info for all patients in these sessions
        all_patient_ids = list({pid for pids in session_patient_ids.values() for pid in pids})
        patient_map: Dict[str, SessionPatientBrief] = {}
        if all_patient_ids:
            pat_res = await session.exec(
                select(Patient.id, Patient.user_id, Patient.contact_number).where(col(Patient.id).in_(all_patient_ids))
            )
            patient_rows = pat_res.all()
            user_ids = [row[1] for row in patient_rows if row[1]]
            user_map_local: Dict[str, tuple[Optional[str], Optional[str]]] = {}
            if user_ids:
                user_res = await session.exec(
                    select(User.id, User.first_name, User.last_name).where(col(User.id).in_(user_ids))
                )
                user_map_local = {row[0]: (row[1], row[2]) for row in user_res.all()}
            for patient_id, user_id, contact_number in patient_rows:
                first_name, last_name = user_map_local.get(user_id, (None, None))
                patient_map[patient_id] = SessionPatientBrief(
                    patient_id=patient_id,
                    first_name=first_name or "",
                    last_name=last_name or "",
                    contact_number=contact_number,
                )

        items: List[SessionListItem] = []
        for s in sessions:
            doc = doctor_map.get(s.doctor_id)
            brn = branch_map.get(s.branch_id)
            slot_duration, max_patients = await _get_session_slot_config(session, s)
            total_slots = len(
                _build_slot_times(
                    s.start_time,
                    s.end_time,
                    slot_duration,
                    max_patients,
                )
            )
            # Build patients list for this session (deduplicated)
            seen_pids: set = set()
            sess_patients: List[SessionPatientBrief] = []
            for pid in session_patient_ids.get(s.id, []):
                if pid not in seen_pids and pid in patient_map:
                    sess_patients.append(patient_map[pid])
                    seen_pids.add(pid)
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
                    total_slots=total_slots,
                    assigned_staff_count=assigned_counts.get(s.id, 0),
                    status=s.status,
                    patients=sess_patients,
                )
            )

        items.sort(key=lambda i: (i.session_date, i.start_time))
        return items
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"CRITICAL ERROR in list_sessions: {e}")
        return []


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

    # Fetch assigned nurses
    staff_res = await session.exec(
        select(User)
        .join(SessionStaff, SessionStaff.staff_id == User.id)
        .where(SessionStaff.schedule_session_id == session_id)
        .where(SessionStaff.role == "nurse")
    )
    nurses = staff_res.all()
    nurse_items = [NurseItem(id=u.id, name=_full_name(u.first_name, u.last_name)) for u in nurses]

    # Fetch queue status
    queue_res = await session.exec(select(SessionQueue).where(SessionQueue.schedule_session_id == session_id))
    queue = queue_res.first()
    queue_status = None
    if queue:
        queue_status = SessionQueueStatus(
            current_doctor_slot=queue.current_doctor_slot,
            current_nurse_slot=queue.current_nurse_slot,
            status=queue.status
        )

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
        assigned_nurses=nurse_items,
        queue_status=queue_status,
    )


@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    _require_roles(current_user, [1, 2])

    schedule_session = await session.get(ScheduleSession, session_id)
    if not schedule_session:
        raise HTTPException(status_code=404, detail="Session not found")

    if current_user.role_as == 2 and current_user.branch_id != schedule_session.branch_id:
        raise HTTPException(status_code=403, detail="Not enough privileges")

    appt_rows = await session.exec(
        select(Appointment.id).where(Appointment.schedule_session_id == session_id)
    )
    appointment_ids = [row for row in appt_rows.all() or []]

    patient_session_rows = await session.exec(
        select(PatientSession.id).where(
            or_(
                PatientSession.schedule_session_id == session_id,
                col(PatientSession.appointment_id).in_(appointment_ids) if appointment_ids else False,
            )
        )
    )
    patient_session_ids = [row for row in patient_session_rows.all() or []]

    await session.exec(delete(SessionIntake).where(SessionIntake.schedule_session_id == session_id))
    await session.exec(delete(SessionQueue).where(SessionQueue.schedule_session_id == session_id))
    await session.exec(delete(SessionStaff).where(SessionStaff.schedule_session_id == session_id))

    if patient_session_ids:
        await session.exec(
            delete(PatientQuestionAnswer).where(col(PatientQuestionAnswer.session_id).in_(patient_session_ids))
        )

    if appointment_ids:
        await session.exec(
            delete(PatientQuestionAnswer).where(col(PatientQuestionAnswer.appointment_id).in_(appointment_ids))
        )
        await session.exec(
            delete(PatientSession).where(col(PatientSession.appointment_id).in_(appointment_ids))
        )
        await session.exec(delete(Appointment).where(col(Appointment.id).in_(appointment_ids)))
    else:
        await session.exec(delete(PatientSession).where(PatientSession.schedule_session_id == session_id))

    await session.exec(delete(ScheduleSession).where(ScheduleSession.id == session_id))
    await session.commit()

    return {"status": "success", "message": "Session deleted"}


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

    patient_ids = {a.patient_id for a in appts if a.patient_id}
    patient_user_rows: List[tuple[str, str]] = []
    user_map: Dict[str, tuple[Optional[str], Optional[str]]] = {}
    if patient_ids:
        patient_res = await session.exec(
            select(Patient.id, Patient.user_id).where(col(Patient.id).in_(patient_ids))
        )
        patient_user_rows = patient_res.all() or []
        user_ids = {row[1] for row in patient_user_rows if row[1]}
        if user_ids:
            user_res = await session.exec(
                select(User.id, User.first_name, User.last_name).where(col(User.id).in_(user_ids))
            )
            user_map = {u[0]: (u[1], u[2]) for u in user_res.all()}

    patient_user_map: Dict[str, str] = {pid: uid for pid, uid in patient_user_rows}

    items: List[SessionPatientItem] = []
    # build slot index map for this session so we can include slot_index per patient
    slot_index_map: Dict[str, int] = {}
    try:
        slot_duration, max_patients = await _get_session_slot_config(session, schedule_session)
        slot_times = _build_slot_times(
            schedule_session.start_time,
            schedule_session.end_time,
            slot_duration,
            max_patients,
        )
        for idx, st in enumerate(slot_times, start=1):
            slot_index_map[st.strftime("%H:%M")] = idx
    except Exception:
        slot_index_map = {}

    for appt in appts:
        user_id = patient_user_map.get(appt.patient_id)
        first_name, last_name = user_map.get(user_id, (None, None))
        display_name = _full_name(first_name, last_name) if user_id else ""
        if not display_name:
            display_name = appt.patient_id
        # determine slot index from appointment_time if possible
        slot_idx: Optional[int] = None
        try:
            slot_idx = slot_index_map.get(appt.appointment_time.strftime("%H:%M"))
        except Exception:
            slot_idx = None

        items.append(
            SessionPatientItem(
                appointment_id=appt.id,
                appointment_time=appt.appointment_time,
                status=appt.status,
                patient_id=appt.patient_id,
                patient_name=display_name,
                slot_index=slot_idx,
            )
        )
    return items


@router.get("/sessions/{session_id}/slots", response_model=List[SessionSlotItem])
async def list_session_slots(
    session_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    schedule_session = await session.get(ScheduleSession, session_id)
    if not schedule_session:
        raise HTTPException(status_code=404, detail="Session not found")

    await _ensure_session_access(session, current_user, schedule_session)

    slot_duration, max_patients = await _get_session_slot_config(session, schedule_session)
    slot_times = _build_slot_times(
        schedule_session.start_time,
        schedule_session.end_time,
        slot_duration,
        max_patients,
    )

    appt_res = await session.exec(
        select(Appointment)
        .where(Appointment.schedule_session_id == session_id)
        .order_by(col(Appointment.appointment_time))
    )
    appts = appt_res.all() or []

    patient_ids = {a.patient_id for a in appts if a.patient_id}
    patient_user_map: Dict[str, str] = {}
    user_map: Dict[str, tuple[Optional[str], Optional[str]]] = {}
    if patient_ids:
        patient_res = await session.exec(
            select(Patient.id, Patient.user_id).where(col(Patient.id).in_(patient_ids))
        )
        patient_rows = patient_res.all() or []
        patient_user_map = {row[0]: row[1] for row in patient_rows if row[1]}
        user_ids = {row[1] for row in patient_rows if row[1]}
        if user_ids:
            user_res = await session.exec(
                select(User.id, User.first_name, User.last_name).where(col(User.id).in_(user_ids))
            )
            user_map = {row[0]: (row[1], row[2]) for row in user_res.all()}

    queue_res = await session.exec(select(SessionQueue).where(SessionQueue.schedule_session_id == session_id))
    queue = queue_res.first()
    current_doctor_slot = queue.current_doctor_slot if queue else 0
    current_nurse_slot = queue.current_nurse_slot if queue else 0

    appointment_by_time: Dict[str, Appointment] = {a.appointment_time.strftime("%H:%M"): a for a in appts}

    slots: List[SessionSlotItem] = []
    for idx, slot_time in enumerate(slot_times, start=1):
        key = slot_time.strftime("%H:%M")
        appt = appointment_by_time.get(key)
        patient_name: Optional[str] = None
        patient_id: Optional[str] = None
        status: Optional[str] = None
        appointment_id: Optional[str] = None

        if appt:
            appointment_id = appt.id
            patient_id = appt.patient_id
            status = appt.status
            user_id = patient_user_map.get(appt.patient_id)
            first_name, last_name = user_map.get(user_id, (None, None)) if user_id else (None, None)
            patient_name = _full_name(first_name, last_name) or appt.patient_id

        slots.append(
            SessionSlotItem(
                slot_index=idx,
                slot_time=key,
                appointment_id=appointment_id,
                patient_id=patient_id,
                patient_name=patient_name,
                status=status,
                is_current_with_doctor=(idx == current_doctor_slot),
                is_current_with_nurse=(idx == current_nurse_slot),
            )
        )

    return slots


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
        if payload.expected_patient_session_updated_at and patient_session.updated_at:
            actual = patient_session.updated_at.replace(microsecond=0).isoformat()
            expected = payload.expected_patient_session_updated_at.replace("Z", "").split(".")[0]
            if actual != expected:
                raise HTTPException(status_code=409, detail="Patient intake was updated by another user")
        patient_session.schedule_session_id = schedule_session_id
        patient_session.intake_status = "completed"
        patient_session.sex = payload.sex
        patient_session.age = payload.age
        patient_session.height_cm = payload.height_cm
        patient_session.weight_kg = payload.weight_kg
        patient_session.notes = payload.notes
        patient_session.updated_at = datetime.utcnow()
    session.add(patient_session)
    await session.flush()

    schedule_session = await session.get(ScheduleSession, schedule_session_id)
    slot_index = 1
    if schedule_session:
        slot_duration, max_patients = await _get_session_slot_config(session, schedule_session)
        slot_times = _build_slot_times(
            schedule_session.start_time,
            schedule_session.end_time,
            slot_duration,
            max_patients,
        )
        for idx, st in enumerate(slot_times, start=1):
            if st.strftime("%H:%M") == appt.appointment_time.strftime("%H:%M"):
                slot_index = idx
                break

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

        existing_intake_res = await session.exec(
            select(SessionIntake).where(
                SessionIntake.schedule_session_id == schedule_session_id,
                SessionIntake.slot_index == slot_index,
                SessionIntake.question_id == answer.question_id,
            )
        )
        existing_intake = existing_intake_res.first()
        if existing_intake:
            existing_intake.answer_text = answer.answer_text
            existing_intake.patient_id = appt.patient_id
            existing_intake.updated_by = current_user.id
            existing_intake.updated_at = datetime.utcnow()
            session.add(existing_intake)
        else:
            session.add(
                SessionIntake(
                    schedule_session_id=schedule_session_id,
                    slot_index=slot_index,
                    question_id=answer.question_id,
                    answer_text=answer.answer_text,
                    patient_id=appt.patient_id,
                    updated_by=current_user.id,
                )
            )

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


class AssignNursesPayload(BaseModel):
    nurse_ids: List[str]

class QueueUpdatePayload(BaseModel):
    current_doctor_slot: Optional[int] = None
    current_nurse_slot: Optional[int] = None
    status: Optional[str] = None

@router.get("/sessions/{session_id}/available-nurses", response_model=List[NurseItem])
async def get_available_nurses(
    session_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    _require_roles(current_user, [1, 2])

    schedule_session = await session.get(ScheduleSession, session_id)
    if not schedule_session:
        raise HTTPException(status_code=404, detail="Session not found")

    if current_user.role_as == 2 and current_user.branch_id != schedule_session.branch_id:
        raise HTTPException(status_code=403, detail="Not enough privileges")

    nurse_users_res = await session.exec(
        select(User).where(User.role_as == 4, User.branch_id == schedule_session.branch_id)
    )
    nurse_users = nurse_users_res.all()

    if not nurse_users:
        return []

    overlapping_sessions_res = await session.exec(
        select(col(ScheduleSession.id))
        .where(
            ScheduleSession.session_date == schedule_session.session_date,
            ScheduleSession.start_time < schedule_session.end_time,
            ScheduleSession.end_time > schedule_session.start_time,
            ScheduleSession.id != session_id
        )
    )
    overlapping_session_ids = overlapping_sessions_res.all()

    busy_nurse_ids = set()
    if overlapping_session_ids:
        busy_staff_res = await session.exec(
            select(col(SessionStaff.staff_id))
            .where(
                col(SessionStaff.schedule_session_id).in_(overlapping_session_ids),
                SessionStaff.role == "nurse",
            )
        )
        busy_nurse_ids = set(busy_staff_res.all())

    assigned_res = await session.exec(
        select(col(SessionStaff.staff_id)).where(
            SessionStaff.schedule_session_id == session_id,
            SessionStaff.role == "nurse",
        )
    )
    already_assigned = set(assigned_res.all())

    busy_nurse_ids.update(already_assigned)

    available_nurses = []
    for u in nurse_users:
        if u.id not in busy_nurse_ids:
            available_nurses.append(NurseItem(id=u.id, name=_full_name(u.first_name, u.last_name)))

    return available_nurses


@router.post("/sessions/{session_id}/assign-nurses")
async def assign_nurses(
    session_id: str,
    payload: AssignNursesPayload,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    _require_roles(current_user, [1, 2])

    schedule_session = await session.get(ScheduleSession, session_id)
    if not schedule_session:
        raise HTTPException(status_code=404, detail="Session not found")

    if current_user.role_as == 2 and current_user.branch_id != schedule_session.branch_id:
        raise HTTPException(status_code=403, detail="Wrong branch")

    if not payload.nurse_ids:
        raise HTTPException(status_code=422, detail="nurse_ids is required")

    unique_nurse_ids = sorted({nid for nid in payload.nurse_ids if nid})

    nurses_res = await session.exec(
        select(User.id).where(
            col(User.id).in_(unique_nurse_ids),
            User.role_as == 4,
            User.branch_id == schedule_session.branch_id,
        )
    )
    valid_nurses = {row for row in nurses_res.all()}
    invalid_nurses = [nid for nid in unique_nurse_ids if nid not in valid_nurses]
    if invalid_nurses:
        raise HTTPException(status_code=422, detail=f"Invalid nurse ids: {', '.join(invalid_nurses)}")

    overlapping_sessions_res = await session.exec(
        select(col(ScheduleSession.id)).where(
            ScheduleSession.session_date == schedule_session.session_date,
            ScheduleSession.start_time < schedule_session.end_time,
            ScheduleSession.end_time > schedule_session.start_time,
            ScheduleSession.id != session_id,
        )
    )
    overlapping_session_ids = overlapping_sessions_res.all() or []

    busy_nurse_ids: set[str] = set()
    if overlapping_session_ids:
        busy_res = await session.exec(
            select(col(SessionStaff.staff_id)).where(
                col(SessionStaff.schedule_session_id).in_(overlapping_session_ids),
                SessionStaff.role == "nurse",
            )
        )
        busy_nurse_ids = set(busy_res.all())

    to_assign = [nid for nid in unique_nurse_ids if nid not in busy_nurse_ids]
    if not to_assign:
        return {"status": "success", "assigned": 0, "skipped_busy": unique_nurse_ids}

    assigned = 0
    for nurse_id in to_assign:
        session.add(
            SessionStaff(
                schedule_session_id=session_id,
                staff_id=nurse_id,
                role="nurse",
                assigned_by=current_user.id,
            )
        )
        assigned += 1

    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        assigned = 0
        for nurse_id in to_assign:
            existing = await session.exec(
                select(SessionStaff).where(
                    SessionStaff.schedule_session_id == session_id,
                    SessionStaff.staff_id == nurse_id,
                    SessionStaff.role == "nurse",
                )
            )
            if not existing.first():
                session.add(
                    SessionStaff(
                        schedule_session_id=session_id,
                        staff_id=nurse_id,
                        role="nurse",
                        assigned_by=current_user.id,
                    )
                )
                assigned += 1
        await session.commit()

    return {
        "status": "success",
        "assigned": assigned,
        "skipped_busy": [nid for nid in unique_nurse_ids if nid in busy_nurse_ids],
    }


@router.get("/my-sessions", response_model=List[SessionListItem])
async def get_my_sessions(
    session_date: Optional[date] = Query(default=None),
    doctor_id: Optional[str] = None,
    branch_id: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    _require_roles(current_user, [4]) # Nurse only

    # Find sessions where this nurse is assigned by joining SessionStaff (filter role=nurse)
    q = (
        select(ScheduleSession)
        .join(SessionStaff, SessionStaff.schedule_session_id == ScheduleSession.id)
        .where(SessionStaff.staff_id == current_user.id, SessionStaff.role == "nurse")
    )

    if session_date:
        q = q.where(ScheduleSession.session_date == session_date)
    if doctor_id:
        q = q.where(ScheduleSession.doctor_id == doctor_id)
    if branch_id:
        q = q.where(ScheduleSession.branch_id == branch_id)

    sessions_res = await session.exec(
        q.order_by(col(ScheduleSession.session_date), col(ScheduleSession.start_time))
    )
    sessions = sessions_res.all() or []

    # Need doctor/branch info
    doctor_ids = {s.doctor_id for s in sessions}
    branch_ids = {s.branch_id for s in sessions}

    doctor_map = {}
    if doctor_ids:
        d_res = await session.exec(select(Doctor).where(col(Doctor.id).in_(doctor_ids)))
        doctor_map = {d.id: d for d in d_res.all()}

    branch_map = {}
    if branch_ids:
        b_res = await session.exec(select(Branch).where(col(Branch.id).in_(branch_ids)))
        branch_map = {b.id: b for b in b_res.all()}

    # Appt counts
    appt_counts = {}
    # We can do a group by count query or iterate. Iterating over sessions for simple count query
    # or one big query.
    # Let's do a simple count query per session or one aggregate if performance needed
    # For now, simple implementation logic from list_sessions

    items = []
    for s in sessions:
        doc = doctor_map.get(s.doctor_id)
        brn = branch_map.get(s.branch_id)

        # Count appts
        c_res = await session.exec(select(col(Appointment.id)).where(Appointment.schedule_session_id == s.id))
        count = len(c_res.all())

        staff_res = await session.exec(
            select(col(SessionStaff.id)).where(
                SessionStaff.schedule_session_id == s.id,
                SessionStaff.role == "nurse",
            )
        )
        assigned_staff_count = len(staff_res.all() or [])

        slot_duration, max_patients = await _get_session_slot_config(session, s)
        total_slots = len(
            _build_slot_times(
                s.start_time,
                s.end_time,
                slot_duration,
                max_patients,
            )
        )

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
                appointment_count=count,
                total_slots=total_slots,
                assigned_staff_count=assigned_staff_count,
                status=s.status
            )
        )

    return items


@router.patch("/sessions/{session_id}/queue")
async def update_session_queue(
    session_id: str,
    payload: QueueUpdatePayload,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    _require_roles(current_user, [1, 2, 4])

    # Check access (reuse _ensure_session_access)
    schedule_session = await session.get(ScheduleSession, session_id)
    if not schedule_session:
        raise HTTPException(status_code=404, detail="Session not found")

    await _ensure_session_access(session, current_user, schedule_session)

    queue_res = await session.exec(select(SessionQueue).where(SessionQueue.schedule_session_id == session_id))
    queue = queue_res.first()

    if not queue:
        queue = SessionQueue(schedule_session_id=session_id)
        session.add(queue)

    slot_duration, max_patients = await _get_session_slot_config(session, schedule_session)
    slot_count = len(
        _build_slot_times(
            schedule_session.start_time,
            schedule_session.end_time,
            slot_duration,
            max_patients,
        )
    )

    def _validate_slot_value(value: int, field_name: str) -> None:
        if value < 0:
            raise HTTPException(status_code=422, detail=f"{field_name} cannot be negative")
        if slot_count > 0 and value > slot_count:
            raise HTTPException(status_code=422, detail=f"{field_name} exceeds available slots ({slot_count})")

    if payload.current_doctor_slot is not None:
        _validate_slot_value(payload.current_doctor_slot, "current_doctor_slot")
        queue.current_doctor_slot = payload.current_doctor_slot
    if payload.current_nurse_slot is not None:
        _validate_slot_value(payload.current_nurse_slot, "current_nurse_slot")
        queue.current_nurse_slot = payload.current_nurse_slot
    if payload.status:
        queue.status = payload.status

    queue.updated_by = current_user.id
    queue.updated_at = datetime.utcnow()

    session.add(queue)
    await session.commit()
    await session.refresh(queue)

    return queue


class PatientSearchItem(BaseModel):
    patient_id: str
    user_id: str
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None


class NewPatientPayload(BaseModel):
    name: str
    age: Optional[int] = None
    address: Optional[str] = None
    phone: str


class AttachPatientPayload(BaseModel):
    patient_id: Optional[str] = None
    new_patient: Optional[NewPatientPayload] = None
    force_replace: bool = False


@router.get("/sessions/{session_id}/patient-search", response_model=List[PatientSearchItem])
async def session_patient_search(
    session_id: str,
    q: Optional[str] = Query(default=None),
    phone: Optional[str] = Query(default=None),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    _require_roles(current_user, [1, 2, 4])

    schedule_session = await session.get(ScheduleSession, session_id)
    if not schedule_session:
        raise HTTPException(status_code=404, detail="Session not found")
    await _ensure_session_access(session, current_user, schedule_session)

    query = (
        select(
            Patient.id,
            User.id,
            User.first_name,
            User.last_name,
            User.contact_number_mobile,
            User.home_address,
        )
        .join(User, User.id == Patient.user_id)
        .where(User.role_as == 5)
    )

    if phone:
        query = query.where(User.contact_number_mobile.contains(phone))
    if q:
        query = query.where(
            or_(
                User.first_name.contains(q),
                User.last_name.contains(q),
                User.contact_number_mobile.contains(q),
            )
        )

    query = query.order_by(User.first_name, User.last_name).limit(30)
    rows = (await session.exec(query)).all() or []

    out: List[PatientSearchItem] = []
    for patient_id, user_id, first_name, last_name, mobile, address in rows:
        out.append(
            PatientSearchItem(
                patient_id=patient_id,
                user_id=user_id,
                name=_full_name(first_name, last_name),
                phone=mobile,
                address=address,
            )
        )
    return out


@router.post("/sessions/{session_id}/slots/{slot_index}/attach-patient")
async def attach_patient_to_slot(
    session_id: str,
    slot_index: int,
    payload: AttachPatientPayload,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    _require_roles(current_user, [1, 2, 4])
    if slot_index < 1:
        raise HTTPException(status_code=422, detail="slot_index must be >= 1")

    schedule_session = await session.get(ScheduleSession, session_id)
    if not schedule_session:
        raise HTTPException(status_code=404, detail="Session not found")
    await _ensure_session_access(session, current_user, schedule_session)

    if not payload.patient_id and not payload.new_patient:
        raise HTTPException(status_code=422, detail="Provide patient_id or new_patient")

    target_patient_id: Optional[str] = payload.patient_id
    created_new_patient = False

    if payload.new_patient:
        parts = [p for p in payload.new_patient.name.strip().split(" ") if p]
        first_name = parts[0] if parts else "Patient"
        last_name = " ".join(parts[1:]) if len(parts) > 1 else ""
        generated_email = f"patient.{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}@hms.local"
        generated_password = "Temp@123"

        new_user = User(
            email=generated_email,
            username=generated_email,
            hashed_password=get_password_hash(generated_password),
            role_as=5,
            is_active=True,
            first_name=first_name,
            last_name=last_name,
            contact_number_mobile=payload.new_patient.phone,
            home_address=payload.new_patient.address,
            branch_id=schedule_session.branch_id,
        )
        session.add(new_user)
        await session.flush()

        new_patient = Patient(
            user_id=new_user.id,
            contact_number=payload.new_patient.phone,
            address=payload.new_patient.address,
        )
        session.add(new_patient)
        await session.flush()
        target_patient_id = new_patient.id
        created_new_patient = True

    patient = await session.get(Patient, target_patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    slot_duration, max_patients = await _get_session_slot_config(session, schedule_session)
    slot_times = _build_slot_times(
        schedule_session.start_time,
        schedule_session.end_time,
        slot_duration,
        max_patients,
    )
    if slot_index > len(slot_times):
        raise HTTPException(status_code=422, detail=f"slot_index out of range (1-{len(slot_times)})")

    slot_time = slot_times[slot_index - 1]

    existing_res = await session.exec(
        select(Appointment).where(
            Appointment.schedule_session_id == session_id,
            Appointment.appointment_time == slot_time,
            Appointment.appointment_date == schedule_session.session_date,
            Appointment.status != "cancelled",
        )
    )
    existing = existing_res.first()

    if existing:
        if existing.patient_id and existing.patient_id != target_patient_id and not payload.force_replace:
            raise HTTPException(status_code=409, detail="Slot already has another patient")
        existing.patient_id = target_patient_id
        existing.updated_at = datetime.utcnow()
        session.add(existing)
        appointment_id = existing.id
    else:
        new_appt = Appointment(
            patient_id=target_patient_id,
            doctor_id=schedule_session.doctor_id,
            branch_id=schedule_session.branch_id,
            schedule_id=schedule_session.schedule_id,
            schedule_session_id=schedule_session.id,
            appointment_date=schedule_session.session_date,
            appointment_time=slot_time,
            status="pending",
            queue_number=slot_index,
            is_walk_in=True,
        )
        session.add(new_appt)
        await session.flush()
        appointment_id = new_appt.id

    await session.commit()
    return {
        "status": 200,
        "appointment_id": appointment_id,
        "patient_id": target_patient_id,
        "created_new_patient": created_new_patient,
    }



