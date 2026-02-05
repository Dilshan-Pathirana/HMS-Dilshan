from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select

from app.core.database import get_session
from app.models.patient import Patient, PatientCreate, PatientRead
from app.models.user import User
from app.api.deps import get_current_active_superuser

router = APIRouter()

@router.post("/", response_model=PatientRead)
async def create_patient(
    patient_in: PatientCreate,
    current_user: User = Depends(get_current_active_superuser),
    session: AsyncSession = Depends(get_session)
):
    # Verify user exists
    user = await session.get(User, patient_in.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    query = select(Patient).where(Patient.user_id == patient_in.user_id)
    result = await session.exec(query)
    if result.first():
         raise HTTPException(status_code=400, detail="Patient profile already exists for this user")

    patient = Patient.model_validate(patient_in)
    session.add(patient)
    await session.commit()
    await session.refresh(patient)
    patient.user = user
    return patient

@router.get("/", response_model=List[PatientRead])
async def read_patients(
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser)
):
    query = select(Patient).offset(skip).limit(limit)
    result = await session.exec(query)
    return result.all()

@router.get("/{patient_id}", response_model=PatientRead)
async def read_patient(
    patient_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser)
):
    patient = await session.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient
