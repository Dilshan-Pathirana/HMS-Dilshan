from typing import Optional
from sqlmodel import SQLModel, Field, Relationship
from uuid import UUID, uuid4
from datetime import date
from .user import User, UserRead

class PatientBase(SQLModel):
    date_of_birth: date
    gender: str
    blood_group: Optional[str] = None
    address: Optional[str] = None
    contact_number: str
    emergency_contact: Optional[str] = None

class Patient(PatientBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id", unique=True)
    
    user: Optional[User] = Relationship()

class PatientCreate(PatientBase):
    user_id: UUID

class PatientRead(PatientBase):
    id: UUID
    user: Optional["UserRead"] = None
