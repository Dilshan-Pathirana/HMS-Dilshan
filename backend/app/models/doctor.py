from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from uuid import uuid4
from .user import User, UserRead
from .doctor_branch_link import DoctorBranchLink

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

    user: Optional[User] = Relationship()
    branches: List["Branch"] = Relationship(back_populates="doctors", link_model=DoctorBranchLink)

class DoctorCreate(DoctorBase):
    user_id: str
    branch_ids: Optional[list[str]] = None

class DoctorRead(DoctorBase):
    id: str
    user: Optional["UserRead"] = None
    branches: Optional[List["Branch"]] = None

# For forward references
from .branch import Branch
