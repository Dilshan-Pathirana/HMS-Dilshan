from __future__ import annotations

from datetime import date, time
from typing import Optional
from uuid import uuid4

from sqlmodel import Field, SQLModel


class DoctorAvailabilityBase(SQLModel):
    doctor_id: str = Field(foreign_key="doctor.id", max_length=36)
    branch_id: str = Field(foreign_key="branch.id", max_length=36)
    specialisation: str = Field(max_length=255)

    availability_date: date
    start_time: time
    end_time: time
    slot_minutes: int = Field(default=30, ge=5, le=240)

    is_blocked: bool = Field(default=False)


class DoctorAvailability(DoctorAvailabilityBase, table=True):
    id: str = Field(
        default_factory=lambda: str(uuid4()),
        primary_key=True,
        max_length=36,
    )


class DoctorAvailabilityCreate(DoctorAvailabilityBase):
    pass


class DoctorAvailabilityRead(DoctorAvailabilityBase):
    id: str
