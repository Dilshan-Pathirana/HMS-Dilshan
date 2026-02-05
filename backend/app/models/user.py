from typing import Optional
from sqlmodel import SQLModel, Field
from uuid import uuid4

class UserBase(SQLModel):
    email: str = Field(index=True, unique=True, max_length=255)
    username: str = Field(index=True, unique=True, max_length=255)
    role_as: int = Field(default=0, description="0=User, 1=SuperAdmin, 2=Doctor, etc")
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
    is_active: Optional[bool] = None
    password: Optional[str] = None
