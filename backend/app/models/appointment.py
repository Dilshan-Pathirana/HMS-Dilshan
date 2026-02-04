from typing import Optional
from datetime import date, time, datetime
from uuid import UUID, uuid4
from sqlmodel import Field, Relationship, SQLModel
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.branch import Branch

class AppointmentBase(SQLModel):
    patient_id: UUID = Field(foreign_key="patient.id")
    doctor_id: UUID = Field(foreign_key="doctor.id")
    branch_id: UUID = Field(foreign_key="branch.id")
    appointment_date: date
    appointment_time: time
    appointment_number: Optional[str] = None
    department: Optional[str] = None
    reason: Optional[str] = None
    notes: Optional[str] = None
    status: str = Field(default="pending") # pending, confirmed, in_progress, completed, cancelled, no_show

class Appointment(AppointmentBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow)

    # Relationships
    patient: Optional[Patient] = Relationship()
    doctor: Optional[Doctor] = Relationship()
    branch: Optional[Branch] = Relationship()

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentRead(AppointmentBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    patient_name: Optional[str] = None 
    doctor_name: Optional[str] = None 
