"""Patient dashboard models – Patch 2.4"""
from __future__ import annotations

from datetime import date, datetime
from typing import Optional
from uuid import uuid4

from sqlmodel import Field, SQLModel, Column
from sqlalchemy import Text


# ---------- HealthCondition ----------

class HealthConditionBase(SQLModel):
    patient_id: str = Field(foreign_key="patient.id", max_length=36, index=True)
    condition_name: str = Field(max_length=255)
    severity: Optional[str] = Field(default=None, max_length=50)  # mild / moderate / severe
    diagnosed_date: Optional[date] = None
    notes: Optional[str] = Field(default=None, sa_column=Column(Text))
    is_active: bool = Field(default=True)


class HealthCondition(HealthConditionBase, table=True):
    __tablename__ = "health_condition"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class HealthConditionCreate(HealthConditionBase):
    pass


class HealthConditionRead(HealthConditionBase):
    id: str
    created_at: datetime


# ---------- Feedback ----------

class FeedbackBase(SQLModel):
    user_id: str = Field(foreign_key="user.id", max_length=36, index=True)
    branch_id: Optional[str] = Field(default=None, foreign_key="branch.id", max_length=36)
    doctor_id: Optional[str] = Field(default=None, foreign_key="doctor.id", max_length=36)
    subject: str = Field(max_length=255)
    message: str = Field(sa_column=Column(Text))
    category: Optional[str] = Field(default="general", max_length=50)  # general / doctor / facility / service
    status: str = Field(default="pending", max_length=20)  # pending / reviewed / resolved
    admin_response: Optional[str] = Field(default=None, sa_column=Column(Text))


class Feedback(FeedbackBase, table=True):
    __tablename__ = "feedback"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)


class FeedbackCreate(FeedbackBase):
    pass


class FeedbackRead(FeedbackBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
