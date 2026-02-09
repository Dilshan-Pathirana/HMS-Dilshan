"""Doctor Sessions & Diseases models — Patch 5.3"""

from sqlmodel import SQLModel, Field
import sqlalchemy as sa
from typing import Optional
from datetime import datetime, date, timezone
import uuid


# ---------- DoctorSession ----------

class DoctorSessionBase(SQLModel):
    doctor_id: str = Field(max_length=36, index=True)
    patient_id: str = Field(max_length=36, index=True)
    session_date: date
    notes: Optional[str] = Field(default=None, sa_column=sa.Column(sa.Text, nullable=True))
    diagnosis: Optional[str] = Field(default=None, max_length=1000)
    prescriptions: Optional[str] = Field(default=None, sa_column=sa.Column(sa.Text, nullable=True))  # JSON string
    status: str = Field(default="active", max_length=20)  # active / completed / cancelled

class DoctorSession(DoctorSessionBase, table=True):
    __tablename__ = "doctor_session"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DoctorSessionCreate(DoctorSessionBase):
    pass

class DoctorSessionRead(DoctorSessionBase):
    id: str
    created_at: datetime
    updated_at: datetime


# ---------- DoctorCreatedDisease ----------

class DoctorCreatedDiseaseBase(SQLModel):
    doctor_id: str = Field(max_length=36, index=True)
    disease_name: str = Field(max_length=300)
    description: Optional[str] = Field(default=None, sa_column=sa.Column(sa.Text, nullable=True))
    symptoms: Optional[str] = Field(default=None, sa_column=sa.Column(sa.Text, nullable=True))  # JSON string

class DoctorCreatedDisease(DoctorCreatedDiseaseBase, table=True):
    __tablename__ = "doctor_created_disease"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DoctorCreatedDiseaseCreate(DoctorCreatedDiseaseBase):
    pass

class DoctorCreatedDiseaseRead(DoctorCreatedDiseaseBase):
    id: str
    created_at: datetime
