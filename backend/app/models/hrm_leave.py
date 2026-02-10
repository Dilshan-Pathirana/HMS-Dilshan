"""HRM Leave models – Patch 4.2

Tables: leave_type, leave, admin_leave
"""
from __future__ import annotations

from datetime import date, datetime
from typing import Optional
from uuid import uuid4

from sqlmodel import Field, SQLModel, Column
from sqlalchemy import Text


# ---------- LeaveType ----------

class LeaveTypeBase(SQLModel):
    name: str = Field(max_length=100)
    max_days_per_year: int = Field(default=14)
    is_paid: bool = Field(default=True)
    requires_approval: bool = Field(default=True)
    is_active: bool = Field(default=True)


class LeaveType(LeaveTypeBase, table=True):
    __tablename__ = "leave_type"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class LeaveTypeCreate(LeaveTypeBase):
    pass


class LeaveTypeRead(LeaveTypeBase):
    id: str
    created_at: datetime


# ---------- Leave ----------

class LeaveBase(SQLModel):
    user_id: str = Field(foreign_key="user.id", max_length=36, index=True)
    branch_id: Optional[str] = Field(default=None, foreign_key="branch.id", max_length=36)
    leave_type_id: str = Field(foreign_key="leave_type.id", max_length=36)
    start_date: date
    end_date: date
    reason: Optional[str] = Field(default=None, sa_column=Column(Text))
    status: str = Field(default="pending", max_length=20)  # pending/approved/rejected
    approved_by: Optional[str] = Field(default=None, foreign_key="user.id", max_length=36)
    approved_at: Optional[datetime] = None
    level: int = Field(default=1)  # 1=first-level, 2=final approval


class Leave(LeaveBase, table=True):
    __tablename__ = "leave"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class LeaveCreate(LeaveBase):
    pass


class LeaveRead(LeaveBase):
    id: str
    created_at: datetime


# ---------- AdminLeave ----------

class AdminLeaveBase(SQLModel):
    leave_id: str = Field(foreign_key="leave.id", max_length=36, index=True)
    admin_id: str = Field(foreign_key="user.id", max_length=36)
    action: str = Field(max_length=20)  # approved/rejected
    notes: Optional[str] = Field(default=None, sa_column=Column(Text))


class AdminLeave(AdminLeaveBase, table=True):
    __tablename__ = "admin_leave"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    actioned_at: datetime = Field(default_factory=datetime.utcnow)


class AdminLeaveCreate(AdminLeaveBase):
    pass


class AdminLeaveRead(AdminLeaveBase):
    id: str
    actioned_at: datetime
