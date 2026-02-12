"""Nurse-domain models – Patch 3.4

Tables: vital_sign, nurse_handover
"""
from __future__ import annotations

from datetime import date, datetime
from typing import Optional
from uuid import uuid4

from sqlmodel import Field, SQLModel, Column
from sqlalchemy import Text


# ---------- VitalSign ----------

class VitalSignBase(SQLModel):
    patient_id: str = Field(foreign_key="patient.id", max_length=36, index=True)
    nurse_id: str = Field(max_length=36, index=True)  # user.id with role nurse
    appointment_id: Optional[str] = Field(default=None, max_length=36)
    temperature: Optional[float] = None
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    pulse_rate: Optional[int] = None
    respiratory_rate: Optional[int] = None
    oxygen_saturation: Optional[float] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    bmi: Optional[float] = None
    blood_sugar: Optional[float] = None
    # Extended nurse assessment fields
    chief_complaint: Optional[str] = Field(default=None, sa_column=Column(Text))
    allergies: Optional[str] = Field(default=None, sa_column=Column(Text))
    chronic_diseases: Optional[str] = Field(default=None, sa_column=Column(Text))
    sleep_quality: Optional[int] = None  # 1-10
    appetite: Optional[str] = Field(default=None, max_length=20)  # poor / normal / excess
    lifestyle_notes: Optional[str] = Field(default=None, sa_column=Column(Text))
    notes: Optional[str] = Field(default=None, sa_column=Column(Text))
    recorded_at: datetime = Field(default_factory=datetime.utcnow)


class VitalSign(VitalSignBase, table=True):
    __tablename__ = "vital_sign"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class VitalSignCreate(VitalSignBase):
    pass


class VitalSignRead(VitalSignBase):
    id: str
    created_at: datetime


# ---------- NurseHandover ----------

class NurseHandoverBase(SQLModel):
    from_nurse_id: str = Field(max_length=36, index=True)
    to_nurse_id: str = Field(max_length=36)
    branch_id: Optional[str] = Field(default=None, max_length=36)
    shift_date: date
    shift_type: str = Field(max_length=20)  # morning / afternoon / night
    patient_summary: Optional[str] = Field(default=None, sa_column=Column(Text))
    pending_tasks: Optional[str] = Field(default=None, sa_column=Column(Text))
    critical_notes: Optional[str] = Field(default=None, sa_column=Column(Text))
    status: str = Field(default="pending", max_length=20)  # pending / acknowledged


class NurseHandover(NurseHandoverBase, table=True):
    __tablename__ = "nurse_handover"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    acknowledged_at: Optional[datetime] = None


class NurseHandoverCreate(NurseHandoverBase):
    pass


class NurseHandoverRead(NurseHandoverBase):
    id: str
    created_at: datetime
    acknowledged_at: Optional[datetime]
