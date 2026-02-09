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
    status: str = Field(default="in_progress", max_length=20)  # in_progress / completed
    chief_complaint: Optional[str] = Field(default=None, sa_column=Column(Text))
    history: Optional[str] = Field(default=None, sa_column=Column(Text))
    examination: Optional[str] = Field(default=None, sa_column=Column(Text))
    notes: Optional[str] = Field(default=None, sa_column=Column(Text))


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
    ordered_by: str = Field(max_length=36)
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
