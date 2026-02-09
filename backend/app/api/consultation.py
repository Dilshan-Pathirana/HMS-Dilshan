"""Consultation endpoints – Patch 3.1

Prefix: /api/v1/consultation
~15 endpoints covering queue, start, submit, diagnoses, prescriptions,
questions, investigations, patient history, audit.
"""
from __future__ import annotations

from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.api.deps import get_current_user
from app.models.user import User
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.consultation import (
    ConsultationRead,
    ConsultationDiagnosisCreate,
    ConsultationDiagnosisRead,
    ConsultationPrescriptionCreate,
    ConsultationPrescriptionRead,
    ConsultationQuestionCreate,
    ConsultationQuestionRead,
    InvestigationCreate,
    InvestigationRead,
)
from app.services.consultation_service import ConsultationService

router = APIRouter()
svc = ConsultationService


# ============================================================
# 1. Queue / Appointments for doctor
# ============================================================

@router.get("/queue/{doctor_id}")
async def patient_queue(
    doctor_id: str,
    appt_date: Optional[date] = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    queue = await svc.get_queue(session, doctor_id, appt_date)
    return {"queue": [a.model_dump() for a in queue]}


@router.get("/appointments/{doctor_id}/{appt_date}")
async def day_appointments(
    doctor_id: str,
    appt_date: date,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    queue = await svc.get_queue(session, doctor_id, appt_date)
    return {"appointments": [a.model_dump() for a in queue]}


# ============================================================
# 2. Patient info + history
# ============================================================

@router.get("/patient/{patient_id}")
async def patient_info(
    patient_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    patient = await session.get(Patient, patient_id)
    if not patient:
        raise HTTPException(404, "Patient not found")
    # get user info
    user = await session.get(User, patient.user_id)
    history = await svc.get_patient_history(session, patient_id)
    return {
        "patient": patient.model_dump(),
        "user": {
            "id": user.id if user else None,
            "email": user.email if user else None,
            "first_name": user.first_name if user else None,
            "last_name": user.last_name if user else None,
        },
        "consultation_history": [c.model_dump() for c in history],
    }


# ============================================================
# 3. Start / Get / Submit consultation
# ============================================================

class StartConsultationRequest(BaseModel):
    doctor_id: str
    patient_id: str
    branch_id: str
    appointment_id: Optional[str] = None
    chief_complaint: Optional[str] = None


class SubmitConsultationRequest(BaseModel):
    notes: Optional[str] = None


@router.post("/start", response_model=ConsultationRead)
async def start_consultation(
    payload: StartConsultationRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await svc.start(
        session,
        payload.doctor_id,
        payload.patient_id,
        payload.branch_id,
        payload.appointment_id,
        payload.chief_complaint,
    )


@router.get("/{consultation_id}", response_model=ConsultationRead)
async def get_consultation(
    consultation_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await svc.get(session, consultation_id)


@router.post("/{consultation_id}/submit", response_model=ConsultationRead)
async def submit_consultation(
    consultation_id: str,
    payload: SubmitConsultationRequest = SubmitConsultationRequest(),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await svc.submit(session, consultation_id, payload.notes)


# ============================================================
# 4. Questions
# ============================================================

@router.get("/questions/bank")
async def question_bank(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Placeholder question templates – extend with real bank later."""
    return {"questions": [
        {"id": "q1", "text": "Chief complaint duration?"},
        {"id": "q2", "text": "Any allergies?"},
        {"id": "q3", "text": "Current medications?"},
        {"id": "q4", "text": "Previous surgeries?"},
        {"id": "q5", "text": "Family medical history?"},
    ]}


@router.post("/{consultation_id}/questions", response_model=ConsultationQuestionRead)
async def add_question(
    consultation_id: str,
    payload: ConsultationQuestionCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    data = payload.model_dump()
    data["consultation_id"] = consultation_id
    return await svc.add_question(session, data)


# ============================================================
# 5. Diagnoses
# ============================================================

@router.get("/diagnoses/list")
async def diagnosis_catalog(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Placeholder ICD catalog – extend with real data."""
    return {"diagnoses": [
        {"code": "J06.9", "name": "Acute upper respiratory infection"},
        {"code": "E11", "name": "Type 2 diabetes mellitus"},
        {"code": "I10", "name": "Essential hypertension"},
        {"code": "K21.0", "name": "Gastro-esophageal reflux with esophagitis"},
        {"code": "M54.5", "name": "Low back pain"},
    ]}


@router.post("/{consultation_id}/diagnoses", response_model=ConsultationDiagnosisRead)
async def add_diagnosis(
    consultation_id: str,
    payload: ConsultationDiagnosisCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    data = payload.model_dump()
    data["consultation_id"] = consultation_id
    return await svc.add_diagnosis(session, data)


# ============================================================
# 6. Prescriptions
# ============================================================

@router.get("/medicines/list")
async def medicine_catalog(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Placeholder medicine catalog – will pull from Product table after 3.2."""
    return {"medicines": [
        {"name": "Paracetamol 500mg", "dosages": ["500mg", "1000mg"]},
        {"name": "Amoxicillin 250mg", "dosages": ["250mg", "500mg"]},
        {"name": "Metformin 500mg", "dosages": ["500mg", "850mg", "1000mg"]},
        {"name": "Omeprazole 20mg", "dosages": ["20mg", "40mg"]},
        {"name": "Losartan 50mg", "dosages": ["25mg", "50mg", "100mg"]},
    ]}


@router.post("/{consultation_id}/prescriptions", response_model=ConsultationPrescriptionRead)
async def add_prescription(
    consultation_id: str,
    payload: ConsultationPrescriptionCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    data = payload.model_dump()
    data["consultation_id"] = consultation_id
    return await svc.add_prescription(session, data)


# ============================================================
# 7. Investigations
# ============================================================

@router.post("/{consultation_id}/investigations", response_model=InvestigationRead)
async def add_investigation(
    consultation_id: str,
    payload: InvestigationCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    data = payload.model_dump()
    data["consultation_id"] = consultation_id
    data["ordered_by"] = current_user.id
    return await svc.add_investigation(session, data)


# ============================================================
# 8. Audit trail
# ============================================================

@router.get("/{consultation_id}/audit")
async def audit_trail(
    consultation_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    c = await svc.get(session, consultation_id)
    diagnoses = await svc.get_diagnoses(session, consultation_id)
    prescriptions = await svc.get_prescriptions(session, consultation_id)
    questions = await svc.get_questions(session, consultation_id)
    investigations = await svc.get_investigations(session, consultation_id)
    return {
        "consultation": c.model_dump(),
        "diagnoses": [d.model_dump() for d in diagnoses],
        "prescriptions": [p.model_dump() for p in prescriptions],
        "questions": [q.model_dump() for q in questions],
        "investigations": [i.model_dump() for i in investigations],
    }
