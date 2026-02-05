from typing import Optional
from datetime import date, time, datetime
from uuid import uuid4
from sqlmodel import Field, Relationship, SQLModel
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.branch import Branch

class AppointmentBase(SQLModel):
    patient_id: str = Field(foreign_key="patient.id", max_length=36)
    doctor_id: str = Field(foreign_key="doctor.id", max_length=36)
    branch_id: str = Field(foreign_key="branch.id", max_length=36)
    appointment_date: date
    appointment_time: time
    appointment_number: Optional[str] = None
    department: Optional[str] = None
    reason: Optional[str] = None
    notes: Optional[str] = None
    status: str = Field(default="pending") # pending, confirmed, in_progress, completed, cancelled, no_show

class Appointment(AppointmentBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow)

    # Relationships
    patient: Optional[Patient] = Relationship()
    doctor: Optional[Doctor] = Relationship()
    branch: Optional[Branch] = Relationship()

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentRead(AppointmentBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None
