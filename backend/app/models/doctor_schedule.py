"""Doctor schedule models – Patch 2.1"""
from __future__ import annotations

from datetime import date, time, datetime
from typing import Optional
from uuid import uuid4

from sqlmodel import Field, SQLModel, Column
from sqlalchemy import Text


# ---------- DoctorSchedule ----------

class DoctorScheduleBase(SQLModel):
    doctor_id: str = Field(foreign_key="doctor.id", max_length=36, index=True)
    branch_id: str = Field(foreign_key="branch.id", max_length=36, index=True)
    day_of_week: int = Field(ge=0, le=6, description="0=Monday … 6=Sunday")
    start_time: time
    end_time: time
    slot_duration_minutes: int = Field(default=30, ge=5, le=240)
    max_patients: int = Field(default=20, ge=1)
    status: str = Field(default="active", max_length=20)  # active / inactive
    recurrence_type: str = Field(default="weekly", max_length=20)  # weekly / biweekly / once
    valid_from: Optional[date] = None
    valid_until: Optional[date] = None


class DoctorSchedule(DoctorScheduleBase, table=True):
    __tablename__ = "doctor_schedule"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)


class DoctorScheduleCreate(DoctorScheduleBase):
    pass


class DoctorScheduleRead(DoctorScheduleBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None


# ---------- DoctorScheduleCancellation ----------

class DoctorScheduleCancellationBase(SQLModel):
    doctor_id: str = Field(foreign_key="doctor.id", max_length=36, index=True)
    schedule_id: str = Field(foreign_key="doctor_schedule.id", max_length=36)
    cancel_date: date
    cancel_end_date: Optional[date] = None  # for range cancellations
    reason: Optional[str] = Field(default=None, sa_column=Column(Text))
    status: str = Field(default="pending", max_length=20)  # pending / approved / rejected
    approved_by: Optional[str] = Field(default=None, foreign_key="user.id", max_length=36)
    cancel_type: str = Field(default="single_day", max_length=20)  # single_day / range


class DoctorScheduleCancellation(DoctorScheduleCancellationBase, table=True):
    __tablename__ = "doctor_schedule_cancellation"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class DoctorScheduleCancellationCreate(DoctorScheduleCancellationBase):
    pass


class DoctorScheduleCancellationRead(DoctorScheduleCancellationBase):
    id: str
    created_at: datetime


# ---------- SlotLock ----------

class SlotLockBase(SQLModel):
    doctor_id: str = Field(foreign_key="doctor.id", max_length=36, index=True)
    schedule_id: Optional[str] = Field(default=None, foreign_key="doctor_schedule.id", max_length=36)
    slot_date: date
    slot_time: time
    locked_by: str = Field(foreign_key="user.id", max_length=36)
    locked_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime
    appointment_id: Optional[str] = Field(default=None, foreign_key="appointment.id", max_length=36)


class SlotLock(SlotLockBase, table=True):
    __tablename__ = "slot_lock"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)


class SlotLockCreate(SlotLockBase):
    pass


class SlotLockRead(SlotLockBase):
    id: str


# ---------- ScheduleModification ----------

class ScheduleModificationBase(SQLModel):
    doctor_id: str = Field(foreign_key="doctor.id", max_length=36, index=True)
    schedule_id: str = Field(foreign_key="doctor_schedule.id", max_length=36)
    modification_type: str = Field(max_length=50)  # time_change / slot_change / cancel / activate
    old_value: Optional[str] = Field(default=None, sa_column=Column(Text))  # JSON
    new_value: Optional[str] = Field(default=None, sa_column=Column(Text))  # JSON
    status: str = Field(default="pending", max_length=20)  # pending / approved / rejected
    approved_by: Optional[str] = Field(default=None, foreign_key="user.id", max_length=36)


class ScheduleModification(ScheduleModificationBase, table=True):
    __tablename__ = "schedule_modification"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ScheduleModificationCreate(ScheduleModificationBase):
    pass


class ScheduleModificationRead(ScheduleModificationBase):
    id: str
    created_at: datetime
