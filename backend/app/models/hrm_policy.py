"""HRM Policy & Service Letter models – Patch 4.5

Tables: hr_policy, service_letter_request
"""
from __future__ import annotations

from datetime import date, datetime
from typing import Optional
from uuid import uuid4

from sqlmodel import Field, SQLModel, Column
from sqlalchemy import Text


# ---------- HRPolicy ----------

class HRPolicyBase(SQLModel):
    title: str = Field(max_length=255)
    content: Optional[str] = Field(default=None, sa_column=Column(Text))
    category: Optional[str] = Field(default=None, max_length=50)
    is_active: bool = Field(default=True)
    effective_from: Optional[date] = None


class HRPolicy(HRPolicyBase, table=True):
    __tablename__ = "hr_policy"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class HRPolicyCreate(HRPolicyBase):
    pass


class HRPolicyRead(HRPolicyBase):
    id: str
    created_at: datetime


# ---------- ServiceLetterRequest ----------

class ServiceLetterRequestBase(SQLModel):
    user_id: str = Field(foreign_key="user.id", max_length=36, index=True)
    purpose: Optional[str] = Field(default=None, sa_column=Column(Text))
    status: str = Field(default="pending", max_length=20)  # pending/approved/generated
    content: Optional[str] = Field(default=None, sa_column=Column(Text))
    approved_by: Optional[str] = Field(default=None, max_length=36)


class ServiceLetterRequest(ServiceLetterRequestBase, table=True):
    __tablename__ = "service_letter_request"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ServiceLetterRequestCreate(ServiceLetterRequestBase):
    pass


class ServiceLetterRequestRead(ServiceLetterRequestBase):
    id: str
    created_at: datetime
