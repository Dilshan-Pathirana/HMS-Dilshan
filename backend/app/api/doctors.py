from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select, SQLModel
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, field_validator
import re

from app.core.database import get_session
from app.models.doctor import Doctor, DoctorRead
from app.models.user import User
from app.models.branch import Branch
from app.models.doctor_branch_link import DoctorBranchLink
from app.api.deps import get_current_active_superuser
from app.core.security import get_password_hash

import logging
logger = logging.getLogger(__name__)

router = APIRouter()

class DoctorCreateRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str
    specialization: str
    qualification: str
    contact_number: str
    experience_years: int
    branch_ids: Optional[list[str]] = None
    photo_path: Optional[str] = None
    nic_photo_path: Optional[str] = None

    @field_validator("first_name")
    @classmethod
    def validate_first_name(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("First name is required")
        if len(v.strip()) < 2:
            raise ValueError("First name must be at least 2 characters")
        return v.strip()

    @field_validator("last_name")
    @classmethod
    def validate_last_name(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Last name is required")
        if len(v.strip()) < 2:
            raise ValueError("Last name must be at least 2 characters")
        return v.strip()

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Email is required")
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, v.strip()):
            raise ValueError("Invalid email format")
        return v.strip().lower()

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not v or len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v

    @field_validator("specialization")
    @classmethod
    def validate_specialization(cls, v: str) -> str:
        if not v or not v.strip() or v.strip().lower() == "general":
            raise ValueError("At least one specialization is required")
        return v.strip()

    @field_validator("qualification")
    @classmethod
    def validate_qualification(cls, v: str) -> str:
        if not v or not v.strip() or v.strip().lower() == "not specified":
            raise ValueError("Qualification is required")
        return v.strip()

    @field_validator("contact_number")
    @classmethod
    def validate_contact_number(cls, v: str) -> str:
        if not v or not v.strip() or v.strip().lower() == "n/a":
            raise ValueError("Mobile number is required")
        cleaned = re.sub(r'[\s\-\(\)]', '', v.strip())
        if not re.match(r'^\+?[0-9]{7,15}$', cleaned):
            raise ValueError("Invalid phone number format")
        return v.strip()

    @field_validator("experience_years")
    @classmethod
    def validate_experience_years(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Experience years cannot be negative")
        if v > 70:
            raise ValueError("Experience years seems invalid")
        return v


@router.post("/", response_model=DoctorRead)
async def create_doctor(
    doctor_in: DoctorCreateRequest,
    current_user: User = Depends(get_current_active_superuser),
    session: AsyncSession = Depends(get_session)
):
    """
    Unified endpoint to create both User and Doctor profile.
    Atomic: either everything succeeds or nothing is saved.
    """
    # 1. Check if email already exists
    query = select(User).where(User.email == doctor_in.email)
    result = await session.exec(query)
    if result.first():
        raise HTTPException(
            status_code=400,
            detail={
                "success": False,
                "errors": {
                    "email": "A user with this email already exists"
                }
            }
        )

    # 2. Check if phone number already exists
    query = select(User).where(User.contact_number_mobile == doctor_in.contact_number)
    result = await session.exec(query)
    if result.first():
        raise HTTPException(
            status_code=400,
            detail={
                "success": False,
                "errors": {
                    "contact_number": "A user with this mobile number already exists"
                }
            }
        )

    # 3. Validate branch_ids exist if provided
    if doctor_in.branch_ids:
        branch_query = select(Branch).where(Branch.id.in_(doctor_in.branch_ids))
        result = await session.exec(branch_query)
        found_branches = result.all()
        if len(found_branches) != len(doctor_in.branch_ids):
            raise HTTPException(
                status_code=400,
                detail={
                    "success": False,
                    "errors": {
                        "branch_ids": "One or more selected branches do not exist"
                    }
                }
            )
    else:
        found_branches = []

    # 4. ATOMIC: Create User + Doctor + Branch links in a single transaction
    try:
        user = User(
            email=doctor_in.email,
            username=doctor_in.email,
            hashed_password=get_password_hash(doctor_in.password),
            role_as=3,
            is_active=True,
            first_name=doctor_in.first_name,
            last_name=doctor_in.last_name,
            contact_number_mobile=doctor_in.contact_number,
            photo_path=doctor_in.photo_path,
            nic_photo_path=doctor_in.nic_photo_path,
        )
        session.add(user)
        await session.flush()  # Get user.id without committing

        doctor = Doctor(
            first_name=doctor_in.first_name,
            last_name=doctor_in.last_name,
            specialization=doctor_in.specialization,
            qualification=doctor_in.qualification,
            contact_number=doctor_in.contact_number,
            experience_years=doctor_in.experience_years,
            user_id=user.id
        )
        session.add(doctor)
        await session.flush()  # Get doctor.id without committing

        # Assign branches via explicit link inserts (avoids async lazy-load issues)
        if found_branches:
            for branch in found_branches:
                link = DoctorBranchLink(doctor_id=doctor.id, branch_id=branch.id)
                session.add(link)

        # Single commit for everything
        await session.commit()
        await session.refresh(doctor)

        # Reload with relationships for response
        query = (
            select(Doctor)
            .options(selectinload(Doctor.user), selectinload(Doctor.branches))
            .where(Doctor.id == doctor.id)
        )
        result = await session.exec(query)
        return result.one()

    except Exception as e:
        await session.rollback()
        logger.error(f"Error creating doctor: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "errors": {
                    "general": f"Failed to create doctor: {str(e)}"
                }
            }
        )

@router.get("/", response_model=List[DoctorRead])
async def read_doctors(
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(get_session),
):
    query = (
        select(Doctor)
        .options(selectinload(Doctor.user), selectinload(Doctor.branches))
        .offset(skip)
        .limit(limit)
    )
    result = await session.exec(query)
    return result.all()

@router.get("/{doctor_id}", response_model=DoctorRead)
async def read_doctor(
    doctor_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser)
):
    query = (
        select(Doctor)
        .options(selectinload(Doctor.user), selectinload(Doctor.branches))
        .where(Doctor.id == doctor_id)
    )
    result = await session.exec(query)
    doctor = result.first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doctor
