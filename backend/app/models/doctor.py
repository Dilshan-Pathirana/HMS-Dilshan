from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from uuid import uuid4
from .user import User, UserRead

class DoctorBase(SQLModel):
    first_name: str
    last_name: str
    specialization: str
    qualification: str
    contact_number: str
    experience_years: int

class Doctor(DoctorBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    user_id: str = Field(foreign_key="user.id", unique=True, max_length=36)
    branch_id: Optional[str] = Field(default=None, foreign_key="branch.id", max_length=36)

    user: Optional[User] = Relationship()
    # branch: Optional["Branch"] = Relationship(back_populates="doctors")

class DoctorCreate(DoctorBase):
    user_id: str
    branch_id: Optional[str] = None

class DoctorRead(DoctorBase):
    id: str
    user: Optional["UserRead"] = None
