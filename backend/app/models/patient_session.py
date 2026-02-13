from __future__ import annotations

from datetime import datetime, date, time
from typing import Optional
from uuid import uuid4

import sqlalchemy as sa
from sqlmodel import Field, SQLModel, Column


class ScheduleSessionBase(SQLModel):
    schedule_id: Optional[str] = Field(default=None, foreign_key="doctor_schedule.id", max_length=36)
    doctor_id: str = Field(foreign_key="doctor.id", max_length=36, index=True)
    branch_id: str = Field(foreign_key="branch.id", max_length=36, index=True)
    session_date: date = Field(index=True)
    start_time: time
    end_time: time
    status: str = Field(default="active", max_length=20)
    session_key: str = Field(max_length=200, index=True)


class ScheduleSession(ScheduleSessionBase, table=True):
    __tablename__ = "schedule_session"  # type: ignore[assignment]
    __table_args__ = (sa.UniqueConstraint("session_key", name="uq_schedule_session_key"),)

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_by: Optional[str] = Field(default=None, foreign_key="user.id", max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)


class ScheduleSessionCreate(ScheduleSessionBase):
    pass


class ScheduleSessionRead(ScheduleSessionBase):
    id: str
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class PatientProfileBase(SQLModel):
    patient_id: str = Field(foreign_key="patient.id", max_length=36, unique=True)
    sex: Optional[str] = Field(default=None, max_length=20)
    age: Optional[int] = Field(default=None)
    height_cm: Optional[float] = Field(default=None)
    weight_kg: Optional[float] = Field(default=None)


class PatientProfile(PatientProfileBase, table=True):
    __tablename__ = "patient_profile"  # type: ignore[assignment]

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_by: Optional[str] = Field(default=None, foreign_key="user.id", max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)


class PatientProfileCreate(PatientProfileBase):
    pass


class PatientProfileRead(PatientProfileBase):
    id: str
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class PatientSessionBase(SQLModel):
    appointment_id: str = Field(foreign_key="appointment.id", max_length=36, index=True)
    schedule_session_id: Optional[str] = Field(default=None, foreign_key="schedule_session.id", max_length=36)
    patient_id: str = Field(foreign_key="patient.id", max_length=36, index=True)
    doctor_id: str = Field(foreign_key="doctor.id", max_length=36, index=True)
    branch_id: str = Field(foreign_key="branch.id", max_length=36, index=True)
    intake_status: str = Field(default="pending", max_length=20)
    sex: Optional[str] = Field(default=None, max_length=20)
    age: Optional[int] = Field(default=None)
    height_cm: Optional[float] = Field(default=None)
    weight_kg: Optional[float] = Field(default=None)
    notes: Optional[str] = Field(default=None, sa_column=Column(sa.Text))
    created_by: Optional[str] = Field(default=None, foreign_key="user.id", max_length=36)


class PatientSession(PatientSessionBase, table=True):
    __tablename__ = "patient_session"  # type: ignore[assignment]

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)


class PatientSessionCreate(PatientSessionBase):
    pass


class PatientSessionRead(PatientSessionBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None


class PatientQuestionAnswerBase(SQLModel):
    patient_profile_id: str = Field(foreign_key="patient_profile.id", max_length=36, index=True)
    patient_id: str = Field(foreign_key="patient.id", max_length=36, index=True)
    question_id: str = Field(foreign_key="doctor_main_question.id", max_length=36, index=True)
    answer_text: str = Field(sa_column=Column(sa.Text))
    created_by: Optional[str] = Field(default=None, foreign_key="user.id", max_length=36)
    session_id: Optional[str] = Field(default=None, foreign_key="patient_session.id", max_length=36)
    appointment_id: Optional[str] = Field(default=None, foreign_key="appointment.id", max_length=36)


class PatientQuestionAnswer(PatientQuestionAnswerBase, table=True):
    __tablename__ = "patient_question_answer"  # type: ignore[assignment]

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class PatientQuestionAnswerCreate(PatientQuestionAnswerBase):
    pass


class PatientQuestionAnswerRead(PatientQuestionAnswerBase):
    id: str
    created_at: datetime


class SessionStaffBase(SQLModel):
    schedule_session_id: str = Field(foreign_key="schedule_session.id", max_length=36, index=True)
    staff_id: str = Field(foreign_key="user.id", max_length=36, index=True)
    role: str = Field(max_length=50)  # e.g., "nurse"


class SessionStaff(SessionStaffBase, table=True):
    __tablename__ = "session_staff"
    __table_args__ = (
        sa.UniqueConstraint("schedule_session_id", "staff_id", "role", name="uq_session_staff_assignment"),
    )
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    assigned_at: datetime = Field(default_factory=datetime.utcnow)
    assigned_by: Optional[str] = Field(default=None, foreign_key="user.id", max_length=36)


class SessionQueueBase(SQLModel):
    schedule_session_id: str = Field(foreign_key="schedule_session.id", max_length=36, unique=True)
    current_doctor_slot: int = Field(default=0)
    current_nurse_slot: int = Field(default=0)
    status: str = Field(default="active", max_length=20)


class SessionQueue(SessionQueueBase, table=True):
    __tablename__ = "session_queue"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    updated_by: Optional[str] = Field(default=None, foreign_key="user.id", max_length=36)


class SessionIntakeBase(SQLModel):
    schedule_session_id: str = Field(foreign_key="schedule_session.id", max_length=36, index=True)
    slot_index: int = Field(ge=1)
    question_id: str = Field(foreign_key="doctor_main_question.id", max_length=36, index=True)
    answer_text: str = Field(sa_column=Column(sa.Text))
    patient_id: Optional[str] = Field(default=None, foreign_key="patient.id", max_length=36, index=True)


class SessionIntake(SessionIntakeBase, table=True):
    __tablename__ = "session_intake"
    __table_args__ = (
        sa.UniqueConstraint("schedule_session_id", "slot_index", "question_id", name="uq_session_intake_slot_question"),
    )

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    updated_by: Optional[str] = Field(default=None, foreign_key="user.id", max_length=36)

