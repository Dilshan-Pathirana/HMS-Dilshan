from typing import Optional
from datetime import datetime
from uuid import UUID, uuid4
from sqlmodel import Field, Relationship, SQLModel
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.branch import Branch
from app.models.appointment import Appointment

# --- Queue Model ---
class QueueBase(SQLModel):
    patient_id: UUID = Field(foreign_key="patient.id")
    doctor_id: Optional[UUID] = Field(default=None, foreign_key="doctor.id")
    branch_id: UUID = Field(foreign_key="branch.id")
    token_number: int
    visit_type: str = Field(default="appointment") 
    priority: str = Field(default="normal") 
    department: Optional[str] = None
    status: str = Field(default="waiting") 

class Queue(QueueBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    called_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    patient: Optional[Patient] = Relationship()
    doctor: Optional[Doctor] = Relationship()
    branch: Optional[Branch] = Relationship()

class QueueCreate(QueueBase):
    pass

class QueueRead(QueueBase):
    id: UUID
    created_at: datetime
    called_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


# --- Visit Model ---
class VisitBase(SQLModel):
    visit_number: str
    patient_id: UUID = Field(foreign_key="patient.id")
    doctor_id: Optional[UUID] = Field(default=None, foreign_key="doctor.id")
    branch_id: UUID = Field(foreign_key="branch.id")
    appointment_id: Optional[UUID] = Field(default=None, foreign_key="appointment.id")
    visit_type: str = Field(default="opd") 
    department: Optional[str] = None
    reason: Optional[str] = None
    notes: Optional[str] = None
    status: str = Field(default="registered") 

class Visit(VisitBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow)

    patient: Optional[Patient] = Relationship()
    doctor: Optional[Doctor] = Relationship()
    branch: Optional[Branch] = Relationship()
    appointment: Optional[Appointment] = Relationship()

class VisitCreate(VisitBase):
    pass

class VisitRead(VisitBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
