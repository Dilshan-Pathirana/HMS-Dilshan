from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select

from app.core.database import get_session
from app.models.doctor import Doctor, DoctorCreate, DoctorRead
from app.models.user import User
from app.api.deps import get_current_active_superuser, get_current_user

router = APIRouter()

@router.post("/", response_model=DoctorRead)
async def create_doctor(
    doctor_in: DoctorCreate,
    current_user: User = Depends(get_current_active_superuser),
    session: AsyncSession = Depends(get_session)
):
    # Verify user exists
    user = await session.get(User, doctor_in.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if doctor profile already exists
    query = select(Doctor).where(Doctor.user_id == doctor_in.user_id)
    result = await session.exec(query)
    if result.first():
         raise HTTPException(status_code=400, detail="Doctor profile already exists for this user")

    doctor = Doctor.model_validate(doctor_in)
    session.add(doctor)
    await session.commit()
    await session.refresh(doctor)
    doctor.user = user
    return doctor

@router.get("/", response_model=List[DoctorRead])
async def read_doctors(
    skip: int = 0,
    limit: int = 100,
     session: AsyncSession = Depends(get_session),
     current_user: User = Depends(get_current_user)
):
    query = select(Doctor).offset(skip).limit(limit)
    result = await session.exec(query)
    return result.all()

@router.get("/{doctor_id}", response_model=DoctorRead)
async def read_doctor(
    doctor_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser)
):
    doctor = await session.get(Doctor, doctor_id)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doctor
