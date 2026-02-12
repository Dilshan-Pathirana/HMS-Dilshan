"""Consultation models – Patch 3.1

Tables: consultation, consultation_diagnosis, consultation_prescription,
        consultation_question, investigation
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import uuid4

from sqlmodel import Field, SQLModel, Column
from sqlalchemy import Text


# ---------- Consultation ----------

class ConsultationBase(SQLModel):
    appointment_id: Optional[str] = Field(default=None, foreign_key="appointment.id", max_length=36)
    doctor_id: str = Field(foreign_key="doctor.id", max_length=36, index=True)
    patient_id: str = Field(foreign_key="patient.id", max_length=36, index=True)
    branch_id: str = Field(foreign_key="branch.id", max_length=36, index=True)
    status: str = Field(default="in_progress", max_length=30)  # in_progress / awaiting_opinion / completed / payment_pending / paid / medicines_issued
    chief_complaint: Optional[str] = Field(default=None, sa_column=Column(Text))
    history: Optional[str] = Field(default=None, sa_column=Column(Text))
    examination: Optional[str] = Field(default=None, sa_column=Column(Text))
    notes: Optional[str] = Field(default=None, sa_column=Column(Text))
    clinical_notes: Optional[str] = Field(default=None, sa_column=Column(Text))
    follow_up_instructions: Optional[str] = Field(default=None, sa_column=Column(Text))
    consultation_fee: float = Field(default=0)
    # Auto-summary fields
    symptom_summary: Optional[str] = Field(default=None, sa_column=Column(Text))
    modalities: Optional[str] = Field(default=None, sa_column=Column(Text))
    mental_emotional: Optional[str] = Field(default=None, sa_column=Column(Text))
    physical_generals: Optional[str] = Field(default=None, sa_column=Column(Text))
    keynotes: Optional[str] = Field(default=None, sa_column=Column(Text))
    # Second opinion
    requires_second_opinion: bool = Field(default=False)
    second_opinion_doctor_id: Optional[str] = Field(default=None, max_length=36)
    second_opinion_status: Optional[str] = Field(default=None, max_length=20)  # pending / approved / rejected
    second_opinion_comment: Optional[str] = Field(default=None, sa_column=Column(Text))
    # Payment/pharmacy tracking
    payment_collected_at: Optional[datetime] = None
    payment_collected_by: Optional[str] = Field(default=None, max_length=36)
    medicines_issued_at: Optional[datetime] = None
    medicines_issued_by: Optional[str] = Field(default=None, max_length=36)


class Consultation(ConsultationBase, table=True):
    __tablename__ = "consultation"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None


class ConsultationCreate(ConsultationBase):
    pass


class ConsultationRead(ConsultationBase):
    id: str
    started_at: datetime
    completed_at: Optional[datetime] = None


# ---------- ConsultationDiagnosis ----------

class ConsultationDiagnosisBase(SQLModel):
    consultation_id: str = Field(foreign_key="consultation.id", max_length=36, index=True)
    diagnosis_code: Optional[str] = Field(default=None, max_length=20)
    diagnosis_name: str = Field(max_length=255)
    diagnosis_type: str = Field(default="primary", max_length=20)  # primary / secondary
    notes: Optional[str] = Field(default=None, sa_column=Column(Text))


class ConsultationDiagnosis(ConsultationDiagnosisBase, table=True):
    __tablename__ = "consultation_diagnosis"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ConsultationDiagnosisCreate(ConsultationDiagnosisBase):
    pass


class ConsultationDiagnosisRead(ConsultationDiagnosisBase):
    id: str
    created_at: datetime


# ---------- ConsultationPrescription ----------

class ConsultationPrescriptionBase(SQLModel):
    consultation_id: str = Field(foreign_key="consultation.id", max_length=36, index=True)
    medicine_name: str = Field(max_length=255)
    dosage: Optional[str] = Field(default=None, max_length=100)
    frequency: Optional[str] = Field(default=None, max_length=100)
    duration: Optional[str] = Field(default=None, max_length=100)
    instructions: Optional[str] = Field(default=None, sa_column=Column(Text))
    quantity: Optional[int] = None


class ConsultationPrescription(ConsultationPrescriptionBase, table=True):
    __tablename__ = "consultation_prescription"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ConsultationPrescriptionCreate(ConsultationPrescriptionBase):
    pass


class ConsultationPrescriptionRead(ConsultationPrescriptionBase):
    id: str
    created_at: datetime


# ---------- ConsultationQuestion ----------

class ConsultationQuestionBase(SQLModel):
    consultation_id: str = Field(foreign_key="consultation.id", max_length=36, index=True)
    question_text: str = Field(sa_column=Column(Text))
    answer_text: Optional[str] = Field(default=None, sa_column=Column(Text))
    question_bank_id: Optional[str] = Field(default=None, max_length=36)
    answer_type: str = Field(default="text", max_length=20)  # text / yes_no / scale / multiple_choice
    options: Optional[str] = Field(default=None, sa_column=Column(Text))  # JSON options for multi-choice
    category: Optional[str] = Field(default=None, max_length=50)  # general_symptoms / mental_state / physical_symptoms / modalities
    is_custom: bool = Field(default=False)
    display_order: int = Field(default=0)


class ConsultationQuestion(ConsultationQuestionBase, table=True):
    __tablename__ = "consultation_question"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ConsultationQuestionCreate(ConsultationQuestionBase):
    pass


class ConsultationQuestionRead(ConsultationQuestionBase):
    id: str
    created_at: datetime


# ---------- Investigation ----------

class InvestigationBase(SQLModel):
    consultation_id: str = Field(foreign_key="consultation.id", max_length=36, index=True)
    patient_id: str = Field(foreign_key="patient.id", max_length=36, index=True)
    investigation_type: str = Field(max_length=100)
    description: Optional[str] = Field(default=None, sa_column=Column(Text))
    status: str = Field(default="ordered", max_length=20)  # ordered / in_progress / completed
    results: Optional[str] = Field(default=None, sa_column=Column(Text))
    ordered_by: str = Field(foreign_key="user.id", max_length=36)
    ordered_at: datetime = Field(default_factory=datetime.utcnow)


class Investigation(InvestigationBase, table=True):
    __tablename__ = "investigation"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    completed_at: Optional[datetime] = None


class InvestigationCreate(InvestigationBase):
    pass


class InvestigationRead(InvestigationBase):
    id: str
    completed_at: Optional[datetime] = None


# ---------- DoctorOpinion (Second Opinion) ----------

class DoctorOpinionBase(SQLModel):
    consultation_id: str = Field(foreign_key="consultation.id", max_length=36, index=True)
    requesting_doctor_id: str = Field(max_length=36)  # doctor who requested
    reviewing_doctor_id: str = Field(max_length=36)   # doctor asked to review
    status: str = Field(default="pending", max_length=20)  # pending / approved / rejected / commented
    comment: Optional[str] = Field(default=None, sa_column=Column(Text))
    suggestion: Optional[str] = Field(default=None, sa_column=Column(Text))


class DoctorOpinion(DoctorOpinionBase, table=True):
    __tablename__ = "doctor_opinion"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    responded_at: Optional[datetime] = None


class DoctorOpinionCreate(DoctorOpinionBase):
    pass


class DoctorOpinionRead(DoctorOpinionBase):
    id: str
    created_at: datetime
    responded_at: Optional[datetime] = None


# ---------- IssuedMedicine (Pharmacy dispensing) ----------

class IssuedMedicineBase(SQLModel):
    consultation_id: str = Field(foreign_key="consultation.id", max_length=36, index=True)
    prescription_id: str = Field(foreign_key="consultation_prescription.id", max_length=36)
    medicine_name: str = Field(max_length=255)
    quantity_issued: int
    batch_number: Optional[str] = Field(default=None, max_length=100)
    issued_by: str = Field(max_length=36)  # pharmacist user_id
    notes: Optional[str] = Field(default=None, sa_column=Column(Text))


class IssuedMedicine(IssuedMedicineBase, table=True):
    __tablename__ = "issued_medicine"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    issued_at: datetime = Field(default_factory=datetime.utcnow)


class IssuedMedicineCreate(IssuedMedicineBase):
    pass


class IssuedMedicineRead(IssuedMedicineBase):
    id: str
    issued_at: datetime


# ---------- QuestionBank (Materia Medica) ----------

class QuestionBankBase(SQLModel):
    category: str = Field(max_length=50)  # general_symptoms / mental_state / physical_symptoms / modalities
    sub_category: Optional[str] = Field(default=None, max_length=100)
    question_text: str = Field(sa_column=Column(Text))
    answer_type: str = Field(default="text", max_length=20)  # text / yes_no / true_false / scale / multiple_choice
    options: Optional[str] = Field(default=None, sa_column=Column(Text))  # JSON array for choices
    is_required: bool = Field(default=False)
    display_order: int = Field(default=0)


class QuestionBank(QuestionBankBase, table=True):
    __tablename__ = "question_bank"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class QuestionBankCreate(QuestionBankBase):
    pass


class QuestionBankRead(QuestionBankBase):
    id: str
    created_at: datetime
