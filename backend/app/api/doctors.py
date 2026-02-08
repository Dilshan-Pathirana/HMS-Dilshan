from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select, SQLModel
from sqlalchemy.orm import selectinload
from pydantic import BaseModel

from app.core.database import get_session
from app.models.doctor import Doctor, DoctorRead
from app.models.user import User
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
    branch_id: Optional[str] = None

@router.post("/", response_model=DoctorRead)
async def create_doctor(
    doctor_in: DoctorCreateRequest,
    current_user: User = Depends(get_current_active_superuser),
    session: AsyncSession = Depends(get_session)
):
    """
    Unified endpoint to create both User and Doctor profile.
    """
    # 1. Check if user exists
    query = select(User).where(User.email == doctor_in.email)
    result = await session.exec(query)
    if result.first():
        raise HTTPException(status_code=400, detail="The user with this email already exists")

    # 2. Create User
    user = User(
        email=doctor_in.email,
        username=doctor_in.email, # Default username to email
        hashed_password=get_password_hash(doctor_in.password),
        # Frontend expects Doctor to be role_as=3 (see frontend UserRole enum)
        role_as=3,
        is_active=True,
        branch_id=doctor_in.branch_id
    )
    session.add(user)

    try:
        await session.commit()
        await session.refresh(user)
    except Exception as e:
        await session.rollback()
        logger.error(f"Error creating user: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")

    # 3. Create Doctor Profile
    doctor = Doctor(
        first_name=doctor_in.first_name,
        last_name=doctor_in.last_name,
        specialization=doctor_in.specialization,
        qualification=doctor_in.qualification,
        contact_number=doctor_in.contact_number,
        experience_years=doctor_in.experience_years,
        user_id=user.id,
        branch_id=doctor_in.branch_id
    )
    session.add(doctor)

    try:
        await session.commit()
        await session.refresh(doctor)
        # Load user for response
        doctor.user = user
        return doctor
    except Exception as e:
        await session.rollback()
        logger.error(f"Error creating doctor profile: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create doctor profile: {str(e)}")

@router.get("/", response_model=List[DoctorRead])
async def read_doctors(
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(get_session),
):
    query = select(Doctor).options(selectinload(Doctor.user)).offset(skip).limit(limit)
    result = await session.exec(query)
    return result.all()

@router.get("/{doctor_id}", response_model=DoctorRead)
async def read_doctor(
    doctor_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser)
):
    query = select(Doctor).options(selectinload(Doctor.user)).where(Doctor.id == doctor_id)
    result = await session.exec(query)
    doctor = result.first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doctor
