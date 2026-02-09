from typing import Optional, List, Dict
from sqlmodel import SQLModel, Field, Relationship
from datetime import date
from pydantic import BaseModel
from uuid import uuid4

# Circular imports handling if needed, but for models usually fine
from app.models.user import User

class PharmacyBase(SQLModel):
    name: str = Field(index=True)
    pharmacy_code: str = Field(unique=True, index=True)
    license_number: str
    license_expiry_date: Optional[date] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    status: str = Field(default="active")  # active, inactive
    
    # Foreign Keys
    branch_id: Optional[str] = Field(default=None, foreign_key="branch.id")
    pharmacist_id: Optional[str] = Field(default=None, foreign_key="user.id", unique=True) # Unique constraint: One pharmacist -> One pharmacy

class Pharmacy(PharmacyBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    
    # Relationships
    branch: Optional["Branch"] = Relationship(back_populates="pharmacies")
    # pharmacist: Optional["User"] = Relationship()

class PharmacyCreate(PharmacyBase):
    pass

class PharmacyUpdate(SQLModel):
    name: Optional[str] = None
    pharmacy_code: Optional[str] = None
    license_number: Optional[str] = None
    license_expiry_date: Optional[date] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    status: Optional[str] = None
    branch_id: Optional[str] = None
    pharmacist_id: Optional[str] = None

class PharmacyRead(PharmacyBase):
    id: str
    branch_center_name: Optional[str] = None
    pharmacist_name: Optional[str] = None
