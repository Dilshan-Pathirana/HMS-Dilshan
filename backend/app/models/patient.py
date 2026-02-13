from typing import Optional
from sqlmodel import SQLModel, Field, Relationship
from uuid import uuid4
from datetime import date
from .user import User, UserRead

class PatientBase(SQLModel):
    # Visitor booking flow may not collect these fields; keep them optional.
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    address: Optional[str] = None
    contact_number: Optional[str] = None
    emergency_contact: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None

class Patient(PatientBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    user_id: str = Field(foreign_key="user.id", unique=True, max_length=36)

    user: Optional[User] = Relationship()

class PatientCreate(PatientBase):
    user_id: str

class PatientRead(PatientBase):
    id: str
    user: Optional["UserRead"] = None
