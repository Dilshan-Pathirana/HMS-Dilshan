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
    first_name: Optional[str] = Field(default=None, max_length=255)
    last_name: Optional[str] = Field(default=None, max_length=255)
    date_of_birth: Optional[str] = Field(default=None, max_length=20)
    gender: Optional[str] = Field(default=None, max_length=20)
    nic_number: Optional[str] = Field(default=None, max_length=50)
    contact_number_mobile: Optional[str] = Field(default=None, max_length=20)
    contact_number_landline: Optional[str] = Field(default=None, max_length=20)
    home_address: Optional[str] = Field(default=None)
    emergency_contact_info: Optional[str] = Field(default=None)
    qualifications: Optional[str] = Field(default=None)
    years_of_experience: Optional[int] = Field(default=None)
    medical_registration_number: Optional[str] = Field(default=None, max_length=100)
    license_validity_date: Optional[str] = Field(default=None, max_length=20)
    joining_date: Optional[str] = Field(default=None, max_length=20)
    employee_id: Optional[str] = Field(default=None, max_length=50)
    contract_type: Optional[str] = Field(default=None, max_length=50)
    contract_duration: Optional[str] = Field(default=None, max_length=50)
    probation_start_date: Optional[str] = Field(default=None, max_length=20)
    probation_end_date: Optional[str] = Field(default=None, max_length=20)
    basic_salary: Optional[float] = Field(default=None)
    compensation_package: Optional[str] = Field(default=None)
    photo_path: Optional[str] = Field(default=None)
    nic_photo_path: Optional[str] = Field(default=None)

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
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    nic_number: Optional[str] = None
    contact_number_mobile: Optional[str] = None
    contact_number_landline: Optional[str] = None
    home_address: Optional[str] = None
    emergency_contact_info: Optional[str] = None
    qualifications: Optional[str] = None
    years_of_experience: Optional[int] = None
    medical_registration_number: Optional[str] = None
    license_validity_date: Optional[str] = None
    joining_date: Optional[str] = None
    employee_id: Optional[str] = None
    contract_type: Optional[str] = None
    contract_duration: Optional[str] = None
    probation_start_date: Optional[str] = None
    probation_end_date: Optional[str] = None
    basic_salary: Optional[float] = None
    compensation_package: Optional[str] = None
    photo_path: Optional[str] = None
    nic_photo_path: Optional[str] = None
    branch_ids: Optional[list[str]] = None
