from typing import Optional
from datetime import datetime
from uuid import uuid4
from sqlmodel import Field, Relationship, SQLModel
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.branch import Branch
from app.models.appointment import Appointment

# --- Queue Model ---
class QueueBase(SQLModel):
    patient_id: str = Field(foreign_key="patient.id", max_length=36)
    doctor_id: Optional[str] = Field(default=None, foreign_key="doctor.id", max_length=36)
    branch_id: str = Field(foreign_key="branch.id", max_length=36)
    token_number: int
    visit_type: str = Field(default="appointment")
    priority: str = Field(default="normal")
    department: Optional[str] = None
    status: str = Field(default="waiting")

class Queue(QueueBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    called_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    patient: Optional[Patient] = Relationship()
    doctor: Optional[Doctor] = Relationship()
    branch: Optional[Branch] = Relationship()

class QueueCreate(QueueBase):
    pass

class QueueRead(QueueBase):
    id: str
    created_at: datetime
    called_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


# --- Visit Model ---
class VisitBase(SQLModel):
    visit_number: str
    patient_id: str = Field(foreign_key="patient.id", max_length=36)
    doctor_id: Optional[str] = Field(default=None, foreign_key="doctor.id", max_length=36)
    branch_id: str = Field(foreign_key="branch.id", max_length=36)
    appointment_id: Optional[str] = Field(default=None, foreign_key="appointment.id", max_length=36)
    visit_type: str = Field(default="opd")
    department: Optional[str] = None
    reason: Optional[str] = None
    notes: Optional[str] = None
    status: str = Field(default="registered")

class Visit(VisitBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow)

    patient: Optional[Patient] = Relationship()
    doctor: Optional[Doctor] = Relationship()
    branch: Optional[Branch] = Relationship()
    appointment: Optional[Appointment] = Relationship()

class VisitCreate(VisitBase):
    pass

class VisitRead(VisitBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
