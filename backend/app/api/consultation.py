"""Consultation endpoints – Patch 4.0

Prefix: /api/v1/consultation
Full workflow: queue, start, submit, question bank, second opinions,
auto-summary, nurse vitals, pharmacy dispensing, audit.
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
    DoctorOpinionRead,
    IssuedMedicineCreate,
    IssuedMedicineRead,
    QuestionBankRead,
)
from app.services.consultation_service import ConsultationService

router = APIRouter()
svc = ConsultationService


# ============================================================
# 1. Queue / Appointments for doctor (enhanced with nurse status)
# ============================================================

@router.get("/queue/{doctor_id}")
async def patient_queue(
    doctor_id: str,
    appt_date: Optional[date] = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    queue = await svc.get_queue(session, doctor_id, appt_date)
    return {"queue": queue}


@router.get("/appointments/{doctor_id}/{appt_date}")
async def day_appointments(
    doctor_id: str,
    appt_date: date,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    queue = await svc.get_queue(session, doctor_id, appt_date)
    return {"appointments": queue}


# ============================================================
# 2. Patient info + history + latest vitals
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
    user = await session.get(User, patient.user_id)
    history = await svc.get_patient_history(session, patient_id)
    vitals = await svc.get_latest_vitals_for_patient(session, patient_id)
    return {
        "patient": patient.model_dump(),
        "user": {
            "id": user.id if user else None,
            "email": user.email if user else None,
            "first_name": user.first_name if user else None,
            "last_name": user.last_name if user else None,
        },
        "consultation_history": [c.model_dump() for c in history],
        "latest_vitals": vitals.model_dump() if vitals else None,
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
    clinical_notes: Optional[str] = None
    follow_up_instructions: Optional[str] = None
    consultation_fee: Optional[float] = None


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


# ============================================================
# Admin Monitoring – Consultation Pipeline Stats
# NOTE: Must be defined BEFORE /{consultation_id} to avoid route shadowing
# ============================================================

@router.get("/monitoring/stats")
async def monitoring_stats(
    branch_id: Optional[str] = None,
    stat_date: Optional[date] = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Consultation pipeline stats for admin dashboards.
    SuperAdmin (role 1) can pass branch_id or see all.
    BranchAdmin (role 2) is auto-scoped to their branch.
    """
    effective_branch = branch_id
    if current_user.role_as == 2:
        effective_branch = current_user.branch_id
    stats = await svc.get_monitoring_stats(session, effective_branch, stat_date)
    return stats


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
    return await svc.submit(
        session,
        consultation_id,
        payload.notes,
        payload.clinical_notes,
        payload.follow_up_instructions,
        payload.consultation_fee,
    )


# ============================================================
# 4. Question Bank (from DB)
# ============================================================

@router.get("/questions/bank")
async def question_bank(
    category: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Return question templates from the question_bank table."""
    questions = await svc.get_question_bank(session, category)
    return {"questions": [q.model_dump() for q in questions]}


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


@router.get("/{consultation_id}/questions")
async def get_questions(
    consultation_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    questions = await svc.get_questions(session, consultation_id)
    return {"questions": [q.model_dump() for q in questions]}


# ============================================================
# 5. Auto-Summary
# ============================================================

@router.post("/{consultation_id}/auto-summary")
async def auto_summary(
    consultation_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Generate auto-summary from Q&A answers, grouped by category."""
    summary = await svc.generate_auto_summary(session, consultation_id)
    return {"summary": summary}


# ============================================================
# 6. Nurse Vitals for consultation
# ============================================================

@router.get("/{consultation_id}/vitals")
async def consultation_vitals(
    consultation_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Get nurse vitals linked to this consultation's appointment."""
    c = await svc.get(session, consultation_id)
    vitals = None
    if c.appointment_id:
        vitals = await svc.get_vitals_for_appointment(session, c.appointment_id)
    if not vitals:
        vitals = await svc.get_latest_vitals_for_patient(session, c.patient_id)
    return {"vitals": vitals.model_dump() if vitals else None}


# ============================================================
# 7. Second Opinion
# ============================================================

class RequestOpinionPayload(BaseModel):
    reviewing_doctor_id: str


class RespondOpinionPayload(BaseModel):
    status: str  # approved / rejected / commented
    comment: Optional[str] = None
    suggestion: Optional[str] = None


@router.post("/{consultation_id}/request-opinion", response_model=DoctorOpinionRead)
async def request_opinion(
    consultation_id: str,
    payload: RequestOpinionPayload,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    # Find doctor_id for current user
    result = await session.exec(select(Doctor).where(Doctor.user_id == current_user.id))
    doctor = result.first()
    if not doctor:
        raise HTTPException(403, "Only doctors can request opinions")
    return await svc.request_second_opinion(
        session, consultation_id, doctor.id, payload.reviewing_doctor_id,
    )


@router.post("/opinions/{opinion_id}/respond", response_model=DoctorOpinionRead)
async def respond_opinion(
    opinion_id: str,
    payload: RespondOpinionPayload,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await svc.respond_to_opinion(
        session, opinion_id, payload.status, payload.comment, payload.suggestion,
    )


@router.get("/{consultation_id}/opinions")
async def list_opinions(
    consultation_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    opinions = await svc.get_opinions_for_consultation(session, consultation_id)
    return {"opinions": [o.model_dump() for o in opinions]}


@router.get("/opinions/pending")
async def pending_opinions(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Get pending second opinion requests for the current doctor."""
    result = await session.exec(select(Doctor).where(Doctor.user_id == current_user.id))
    doctor = result.first()
    if not doctor:
        return {"opinions": []}
    opinions = await svc.get_pending_opinions_for_doctor(session, doctor.id)
    return {"opinions": [o.model_dump() for o in opinions]}


# ============================================================
# 8. Diagnoses
# ============================================================

@router.get("/diagnoses/list")
async def diagnosis_catalog(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Homeopathic + ICD diagnosis catalog."""
    return {"diagnoses": [
        {"code": "J06.9", "name": "Acute upper respiratory infection"},
        {"code": "E11", "name": "Type 2 diabetes mellitus"},
        {"code": "I10", "name": "Essential hypertension"},
        {"code": "K21.0", "name": "Gastro-esophageal reflux with esophagitis"},
        {"code": "M54.5", "name": "Low back pain"},
        {"code": "J45", "name": "Asthma"},
        {"code": "F41.1", "name": "Generalized anxiety disorder"},
        {"code": "L20", "name": "Atopic dermatitis / Eczema"},
        {"code": "K30", "name": "Functional dyspepsia"},
        {"code": "G43", "name": "Migraine"},
        {"code": "R51", "name": "Headache"},
        {"code": "R10.4", "name": "Abdominal pain, unspecified"},
        {"code": "N39.0", "name": "Urinary tract infection"},
        {"code": "J00", "name": "Common cold / Acute nasopharyngitis"},
        {"code": "L50", "name": "Urticaria"},
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


@router.get("/{consultation_id}/diagnoses")
async def get_diagnoses(
    consultation_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    diagnoses = await svc.get_diagnoses(session, consultation_id)
    return {"diagnoses": [d.model_dump() for d in diagnoses]}


# ============================================================
# 9. Prescriptions
# ============================================================

@router.get("/medicines/list")
async def medicine_catalog(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Homeopathic medicine catalog with potencies."""
    return {"medicines": [
        {"name": "Aconitum Napellus", "potencies": ["6C", "30C", "200C", "1M"], "dosages": ["6C", "30C", "200C"]},
        {"name": "Arsenicum Album", "potencies": ["6C", "30C", "200C", "1M"], "dosages": ["6C", "30C", "200C"]},
        {"name": "Belladonna", "potencies": ["6C", "30C", "200C", "1M"], "dosages": ["6C", "30C", "200C"]},
        {"name": "Bryonia Alba", "potencies": ["6C", "30C", "200C"], "dosages": ["6C", "30C", "200C"]},
        {"name": "Calcarea Carbonica", "potencies": ["6C", "30C", "200C", "1M"], "dosages": ["6C", "30C", "200C"]},
        {"name": "Chamomilla", "potencies": ["6C", "30C", "200C"], "dosages": ["6C", "30C"]},
        {"name": "Ignatia Amara", "potencies": ["6C", "30C", "200C", "1M"], "dosages": ["30C", "200C"]},
        {"name": "Lycopodium", "potencies": ["6C", "30C", "200C", "1M"], "dosages": ["30C", "200C"]},
        {"name": "Natrum Muriaticum", "potencies": ["6C", "30C", "200C", "1M"], "dosages": ["30C", "200C"]},
        {"name": "Nux Vomica", "potencies": ["6C", "30C", "200C", "1M"], "dosages": ["6C", "30C", "200C"]},
        {"name": "Phosphorus", "potencies": ["6C", "30C", "200C", "1M"], "dosages": ["30C", "200C"]},
        {"name": "Pulsatilla", "potencies": ["6C", "30C", "200C", "1M"], "dosages": ["6C", "30C", "200C"]},
        {"name": "Rhus Toxicodendron", "potencies": ["6C", "30C", "200C"], "dosages": ["6C", "30C"]},
        {"name": "Sepia", "potencies": ["6C", "30C", "200C", "1M"], "dosages": ["30C", "200C"]},
        {"name": "Sulphur", "potencies": ["6C", "30C", "200C", "1M"], "dosages": ["30C", "200C"]},
        {"name": "Thuja Occidentalis", "potencies": ["6C", "30C", "200C"], "dosages": ["30C", "200C"]},
        {"name": "Arnica Montana", "potencies": ["6C", "30C", "200C", "1M"], "dosages": ["6C", "30C", "200C"]},
        {"name": "Apis Mellifica", "potencies": ["6C", "30C", "200C"], "dosages": ["6C", "30C"]},
        {"name": "Gelsemium", "potencies": ["6C", "30C", "200C"], "dosages": ["6C", "30C", "200C"]},
        {"name": "Mercurius Solubilis", "potencies": ["6C", "30C", "200C"], "dosages": ["6C", "30C"]},
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


@router.get("/{consultation_id}/prescriptions")
async def get_prescriptions(
    consultation_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    prescriptions = await svc.get_prescriptions(session, consultation_id)
    return {"prescriptions": [p.model_dump() for p in prescriptions]}


# ============================================================
# 10. Investigations
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
# 11. Pharmacy – Issue Medicines
# ============================================================

@router.get("/pharmacy/queue")
async def pharmacy_queue(
    branch_id: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Get consultations ready for pharmacy dispensing."""
    queue = await svc.get_pharmacy_queue(session, branch_id)
    return {"queue": queue}


@router.post("/{consultation_id}/issue-medicine", response_model=IssuedMedicineRead)
async def issue_medicine(
    consultation_id: str,
    payload: IssuedMedicineCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    data = payload.model_dump()
    data["consultation_id"] = consultation_id
    data["issued_by"] = current_user.id
    return await svc.issue_medicine(session, data)


@router.post("/{consultation_id}/mark-issued")
async def mark_medicines_issued(
    consultation_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Mark all medicines as issued for this consultation."""
    c = await svc.mark_medicines_issued(session, consultation_id, current_user.id)
    return {"consultation": c.model_dump()}


@router.get("/{consultation_id}/issued-medicines")
async def get_issued_medicines(
    consultation_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    medicines = await svc.get_issued_medicines(session, consultation_id)
    return {"issued_medicines": [m.model_dump() for m in medicines]}


# ============================================================
# 12. Payment
# ============================================================

class CollectPaymentPayload(BaseModel):
    fee: Optional[float] = None


@router.post("/{consultation_id}/collect-payment")
async def collect_payment(
    consultation_id: str,
    payload: CollectPaymentPayload = CollectPaymentPayload(),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    c = await svc.collect_payment(session, consultation_id, current_user.id, payload.fee)
    return {"consultation": c.model_dump()}


# ============================================================
# 13. Audit trail (enhanced)
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
    opinions = await svc.get_opinions_for_consultation(session, consultation_id)
    issued = await svc.get_issued_medicines(session, consultation_id)

    # Get vitals
    vitals = None
    if c.appointment_id:
        v = await svc.get_vitals_for_appointment(session, c.appointment_id)
        vitals = v.model_dump() if v else None

    return {
        "consultation": c.model_dump(),
        "diagnoses": [d.model_dump() for d in diagnoses],
        "prescriptions": [p.model_dump() for p in prescriptions],
        "questions": [q.model_dump() for q in questions],
        "investigations": [i.model_dump() for i in investigations],
        "opinions": [o.model_dump() for o in opinions],
        "issued_medicines": [m.model_dump() for m in issued],
        "vitals": vitals,
    }
