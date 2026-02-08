from typing import Optional
from sqlmodel import SQLModel, Field, Relationship
from uuid import uuid4
from datetime import date
from .user import User, UserRead
from .branch import Branch  # Assuming Branch model exists

class PharmacistBase(SQLModel):
    first_name: str
    last_name: str
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    nic_number: Optional[str] = None
    contact_number_mobile: Optional[str] = None
    contact_number_landline: Optional[str] = None
    home_address: Optional[str] = None
    emergency_contact_info: Optional[str] = None
    
    # Pharmacist specific fields
    pharmacist_registration_number: Optional[str] = None
    work_experience: Optional[str] = None
    years_of_experience: Optional[int] = 0
    previous_employment: Optional[str] = None
    license_validity_date: Optional[date] = None
    qualifications: Optional[str] = None
    joining_date: Optional[date] = None
    contract_type: Optional[str] = None
    contract_duration: Optional[str] = None
    probation_start_date: Optional[date] = None
    probation_end_date: Optional[date] = None
    basic_salary: Optional[float] = None
    compensation_package: Optional[str] = None
    
    photo_path: Optional[str] = None
    nic_photo_path: Optional[str] = None

class Pharmacist(PharmacistBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    user_id: str = Field(foreign_key="user.id", unique=True, max_length=36)
    # branch_id removed
    
    user: Optional[User] = Relationship()
    # branch relationship removed

class PharmacistCreate(PharmacistBase):
    pass

class PharmacistRead(PharmacistBase):
    id: str
    user: Optional[UserRead] = None
