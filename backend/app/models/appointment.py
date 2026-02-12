from typing import Optional
from datetime import date, time, datetime
from uuid import uuid4
from sqlmodel import Field, Relationship, SQLModel, Column
from sqlalchemy import Text
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.branch import Branch

class AppointmentBase(SQLModel):
    patient_id: str = Field(foreign_key="patient.id", max_length=36)
    doctor_id: str = Field(foreign_key="doctor.id", max_length=36)
    branch_id: str = Field(foreign_key="branch.id", max_length=36)
    schedule_id: Optional[str] = Field(default=None, foreign_key="doctor_schedule.id", max_length=36)
    schedule_session_id: Optional[str] = Field(default=None, foreign_key="schedule_session.id", max_length=36)
    appointment_date: date
    appointment_time: time
    appointment_number: Optional[str] = None
    department: Optional[str] = None
    reason: Optional[str] = None
    notes: Optional[str] = None
    status: str = Field(default="pending") # pending, confirmed, in_progress, completed, cancelled, no_show
    # --- Patch 2.2 additions ---
    verification_code: Optional[str] = Field(default=None, max_length=10)
    payment_status: Optional[str] = Field(default="unpaid", max_length=20)  # unpaid, paid, refunded, partial
    payment_amount: Optional[float] = Field(default=None)
    payment_method: Optional[str] = Field(default=None, max_length=50)  # cash, card, online
    payment_reference: Optional[str] = Field(default=None, max_length=100)
    cancellation_reason: Optional[str] = Field(default=None, sa_column=Column(Text))
    cancelled_by: Optional[str] = Field(default=None, foreign_key="user.id", max_length=36)
    check_in_time: Optional[datetime] = Field(default=None)
    consultation_start: Optional[datetime] = Field(default=None)
    consultation_end: Optional[datetime] = Field(default=None)
    is_walk_in: bool = Field(default=False)
    queue_number: Optional[int] = Field(default=None)
    reschedule_count: int = Field(default=0)
    original_appointment_date: Optional[datetime] = Field(default=None)
    nurse_assessment_status: Optional[str] = Field(default=None, max_length=20)  # null / completed

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
