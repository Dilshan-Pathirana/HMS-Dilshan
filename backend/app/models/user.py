from typing import Optional
from sqlmodel import SQLModel, Field
from uuid import uuid4

class UserBase(SQLModel):
    email: str = Field(index=True, unique=True, max_length=255)
    username: str = Field(index=True, unique=True, max_length=255)
    role_as: int = Field(
        default=0,
        description="0=User, 1=SuperAdmin, 2=BranchAdmin, 3=Doctor, 4=Nurse, 5=Patient, 6=Cashier, 7=Pharmacist, 8=ITSupport, 9=CenterAid, 10=Auditor",
    )
    branch_id: Optional[str] = Field(default=None, foreign_key="branch.id")
    is_active: bool = True

class User(UserBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    hashed_password: str

class UserCreate(UserBase):
    password: str

class UserRead(UserBase):
    id: str

class UserUpdate(SQLModel):
    email: Optional[str] = None
    username: Optional[str] = None
    role_as: Optional[int] = None
    branch_id: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None
