"""System Settings & Public Website models — Patch 5.10"""

from sqlmodel import SQLModel, Field
import sqlalchemy as sa
from typing import Optional
from datetime import datetime, timezone
import uuid


# ---------- SystemSettings ----------

class SystemSettingsBase(SQLModel):
    key: str = Field(max_length=100, index=True, unique=True)
    value: Optional[str] = Field(default=None, sa_column=sa.Column(sa.Text, nullable=True))
    category: Optional[str] = Field(default=None, max_length=50)
    description: Optional[str] = Field(default=None, max_length=500)

class SystemSettings(SystemSettingsBase, table=True):
    __tablename__ = "system_settings"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SystemSettingsCreate(SystemSettingsBase):
    pass

class SystemSettingsRead(SystemSettingsBase):
    id: str
    created_at: datetime
    updated_at: datetime


# ---------- WebDoctor ----------

class WebDoctorBase(SQLModel):
    doctor_id: Optional[str] = Field(default=None, foreign_key="doctor.id", max_length=36, index=True)
    display_name: str = Field(max_length=200)
    photo: Optional[str] = Field(default=None, max_length=500)
    bio: Optional[str] = Field(default=None, sa_column=sa.Column(sa.Text, nullable=True))
    specialization: Optional[str] = Field(default=None, max_length=200)
    display_order: int = Field(default=0)

class WebDoctor(WebDoctorBase, table=True):
    __tablename__ = "web_doctor"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WebDoctorCreate(WebDoctorBase):
    pass

class WebDoctorRead(WebDoctorBase):
    id: str
    created_at: datetime


# ---------- WebService ----------

class WebServiceBase(SQLModel):
    title: str = Field(max_length=200)
    description: Optional[str] = Field(default=None, sa_column=sa.Column(sa.Text, nullable=True))
    icon: Optional[str] = Field(default=None, max_length=100)
    display_order: int = Field(default=0)
    is_active: bool = Field(default=True)

class WebService(WebServiceBase, table=True):
    __tablename__ = "web_service"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WebServiceCreate(WebServiceBase):
    pass

class WebServiceRead(WebServiceBase):
    id: str
    created_at: datetime


# ---------- ContactMessage ----------

class ContactMessageBase(SQLModel):
    name: str = Field(max_length=200)
    email: Optional[str] = Field(default=None, max_length=200)
    phone: Optional[str] = Field(default=None, max_length=20)
    subject: Optional[str] = Field(default=None, max_length=300)
    message: str = Field(sa_column=sa.Column(sa.Text, nullable=False))
    status: str = Field(default="new", max_length=20)  # new / read / responded
    responded_at: Optional[datetime] = Field(default=None)

class ContactMessage(ContactMessageBase, table=True):
    __tablename__ = "contact_message"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ContactMessageCreate(ContactMessageBase):
    pass

class ContactMessageRead(ContactMessageBase):
    id: str
    created_at: datetime
