from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from uuid import UUID, uuid4
from .user import User, UserRead

class DoctorBase(SQLModel):
    specialization: str
    qualification: str
    contact_number: str
    experience_years: int

class Doctor(DoctorBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id", unique=True)
    branch_id: Optional[UUID] = Field(default=None, foreign_key="branch.id")

    user: Optional[User] = Relationship()
    # branch: Optional["Branch"] = Relationship(back_populates="doctors") 

class DoctorCreate(DoctorBase):
    user_id: UUID
    branch_id: Optional[UUID] = None

class DoctorRead(DoctorBase):
    id: UUID
    user: Optional["UserRead"] = None
