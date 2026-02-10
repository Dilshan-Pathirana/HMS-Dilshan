"""Appointment supporting models – Patch 2.2"""
from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import uuid4

from sqlmodel import Field, SQLModel, Column
from sqlalchemy import Text


# ---------- AppointmentAuditLog ----------

class AppointmentAuditLogBase(SQLModel):
    appointment_id: str = Field(foreign_key="appointment.id", max_length=36, index=True)
    action: str = Field(max_length=50)  # created, status_changed, cancelled, rescheduled, payment_updated
    changed_by: str = Field(foreign_key="user.id", max_length=36)
    old_data: Optional[str] = Field(default=None, sa_column=Column(Text))  # JSON
    new_data: Optional[str] = Field(default=None, sa_column=Column(Text))  # JSON


class AppointmentAuditLog(AppointmentAuditLogBase, table=True):
    __tablename__ = "appointment_audit_log"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AppointmentAuditLogRead(AppointmentAuditLogBase):
    id: str
    created_at: datetime


# ---------- AppointmentSettings ----------

class AppointmentSettingsBase(SQLModel):
    branch_id: str = Field(foreign_key="branch.id", max_length=36, index=True, unique=True)
    max_daily_appointments: int = Field(default=50)
    slot_duration: int = Field(default=30)
    booking_advance_days: int = Field(default=30)
    cancellation_deadline_hours: int = Field(default=24)
    payment_required: bool = Field(default=False)


class AppointmentSettings(AppointmentSettingsBase, table=True):
    __tablename__ = "appointment_settings"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)


class AppointmentSettingsCreate(AppointmentSettingsBase):
    pass


class AppointmentSettingsRead(AppointmentSettingsBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
