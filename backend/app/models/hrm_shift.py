"""HRM Shifts & Attendance models – Patch 4.4

Tables: employee_shift, attendance, bank_detail
"""
from __future__ import annotations

from datetime import date, datetime, time
from typing import Optional
from uuid import uuid4

from sqlmodel import Field, SQLModel, Column
from sqlalchemy import Text


# ---------- EmployeeShift ----------

class EmployeeShiftBase(SQLModel):
    user_id: str = Field(foreign_key="user.id", max_length=36, index=True)
    branch_id: Optional[str] = Field(default=None, foreign_key="branch.id", max_length=36)
    shift_date: date
    start_time: time
    end_time: time
    shift_type: str = Field(max_length=20)  # morning/afternoon/night
    status: str = Field(default="scheduled", max_length=20)  # scheduled/acknowledged/completed
    acknowledged_at: Optional[datetime] = None


class EmployeeShift(EmployeeShiftBase, table=True):
    __tablename__ = "employee_shift"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class EmployeeShiftCreate(EmployeeShiftBase):
    pass


class EmployeeShiftRead(EmployeeShiftBase):
    id: str
    created_at: datetime


# ---------- Attendance ----------

class AttendanceBase(SQLModel):
    user_id: str = Field(foreign_key="user.id", max_length=36, index=True)
    attendance_date: date
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    status: str = Field(default="present", max_length=20)  # present/absent/late/half-day
    notes: Optional[str] = Field(default=None, sa_column=Column(Text))


class Attendance(AttendanceBase, table=True):
    __tablename__ = "attendance"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AttendanceCreate(AttendanceBase):
    pass


class AttendanceRead(AttendanceBase):
    id: str
    created_at: datetime


# ---------- BankDetail ----------

class BankDetailBase(SQLModel):
    user_id: str = Field(foreign_key="user.id", max_length=36, index=True)
    bank_name: str = Field(max_length=100)
    branch_name: Optional[str] = Field(default=None, max_length=100)
    account_number: str = Field(max_length=50)
    account_type: Optional[str] = Field(default=None, max_length=30)  # savings/current


class BankDetail(BankDetailBase, table=True):
    __tablename__ = "bank_detail"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class BankDetailCreate(BankDetailBase):
    pass


class BankDetailRead(BankDetailBase):
    id: str
    created_at: datetime
