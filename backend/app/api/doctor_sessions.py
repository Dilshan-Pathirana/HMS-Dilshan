"""Doctor Sessions & Diseases endpoints — Patch 5.3"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import select, col
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import Optional
from datetime import datetime, timezone

from app.core.database import get_session
from app.api.deps import get_current_user
from app.models.user import User
from app.models.doctor_session import (
    DoctorSession, DoctorSessionRead,
    DoctorCreatedDisease, DoctorCreatedDiseaseRead,
)

router = APIRouter()


# ---- SESSIONS ----

@router.post("/sessions", response_model=DoctorSessionRead, status_code=201)
async def create_session(
    payload: dict,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    ds = DoctorSession(
        doctor_id=current_user.id,
        patient_id=payload.get("patient_id", ""),
        session_date=payload.get("session_date"),
        notes=payload.get("notes"),
        diagnosis=payload.get("diagnosis"),
        prescriptions=payload.get("prescriptions"),
        status=payload.get("status", "active"),
    )
    session.add(ds)
    await session.commit()
    await session.refresh(ds)
    return ds


@router.get("/sessions", response_model=list[DoctorSessionRead])
async def list_my_sessions(
    patient_id: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    query = select(DoctorSession).where(DoctorSession.doctor_id == current_user.id)
    if patient_id:
        query = query.where(DoctorSession.patient_id == patient_id)
    if status:
        query = query.where(DoctorSession.status == status)
    query = query.order_by(col(DoctorSession.session_date).desc()).offset(skip).limit(limit)
    result = await session.exec(query)
    return list(result.all())


@router.get("/sessions/{session_id}", response_model=DoctorSessionRead)
async def get_session_detail(
    session_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    ds = await session.get(DoctorSession, session_id)
    if not ds:
        raise HTTPException(status_code=404, detail="Session not found")
    return ds


@router.put("/sessions/{session_id}", response_model=DoctorSessionRead)
async def update_session(
    session_id: str,
    payload: dict,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    ds = await session.get(DoctorSession, session_id)
    if not ds or ds.doctor_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")
    for key in ("notes", "diagnosis", "prescriptions", "status", "session_date"):
        if key in payload:
            setattr(ds, key, payload[key])
    ds.updated_at = datetime.now(timezone.utc)
    session.add(ds)
    await session.commit()
    await session.refresh(ds)
    return ds


@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    ds = await session.get(DoctorSession, session_id)
    if not ds or ds.doctor_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")
    await session.delete(ds)
    await session.commit()
    return {"message": "Session deleted"}


# ---- DISEASES ----

@router.post("/diseases", response_model=DoctorCreatedDiseaseRead, status_code=201)
async def create_disease(
    payload: dict,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    disease = DoctorCreatedDisease(
        doctor_id=current_user.id,
        disease_name=payload.get("disease_name", ""),
        description=payload.get("description"),
        symptoms=payload.get("symptoms"),
    )
    session.add(disease)
    await session.commit()
    await session.refresh(disease)
    return disease


@router.get("/diseases", response_model=list[DoctorCreatedDiseaseRead])
async def list_diseases(
    q: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    query = select(DoctorCreatedDisease).where(DoctorCreatedDisease.doctor_id == current_user.id)
    if q:
        query = query.where(col(DoctorCreatedDisease.disease_name).ilike(f"%{q}%"))
    query = query.order_by(col(DoctorCreatedDisease.created_at).desc())
    result = await session.exec(query)
    return list(result.all())


@router.put("/diseases/{disease_id}", response_model=DoctorCreatedDiseaseRead)
async def update_disease(
    disease_id: str,
    payload: dict,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    d = await session.get(DoctorCreatedDisease, disease_id)
    if not d or d.doctor_id != current_user.id:
        raise HTTPException(status_code=404, detail="Disease not found")
    for key in ("disease_name", "description", "symptoms"):
        if key in payload:
            setattr(d, key, payload[key])
    session.add(d)
    await session.commit()
    await session.refresh(d)
    return d


@router.delete("/diseases/{disease_id}")
async def delete_disease(
    disease_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    d = await session.get(DoctorCreatedDisease, disease_id)
    if not d or d.doctor_id != current_user.id:
        raise HTTPException(status_code=404, detail="Disease not found")
    await session.delete(d)
    await session.commit()
    return {"message": "Disease deleted"}
