from typing import Optional, List
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select, func
from app.core.database import get_session
from app.models.user import User
from app.core.security import get_password_hash
from app.api.deps import get_current_active_staff, get_current_user
from app.models.nurse_domain import (
    VitalSign, VitalSignCreate, VitalSignRead,
    NurseHandover, NurseHandoverCreate, NurseHandoverRead,
)
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/create-nurse", response_model=dict)
async def create_nurse(
    first_name: str = Form(...),
    last_name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    branch_id: Optional[str] = Form(None),
    date_of_birth: Optional[str] = Form(None),

    gender: Optional[str] = Form(None),
    nic_number: Optional[str] = Form(None),
    contact_number_mobile: Optional[str] = Form(None),
    contact_number_landline: Optional[str] = Form(None),
    home_address: Optional[str] = Form(None),
    emergency_contact_info: Optional[str] = Form(None),

    medical_registration_number: Optional[str] = Form(None),
    qualifications: Optional[str] = Form(None),
    years_of_experience: Optional[str] = Form(None),
    license_validity_date: Optional[str] = Form(None),
    joining_date: Optional[str] = Form(None),
    employee_id: Optional[str] = Form(None),
    contract_type: Optional[str] = Form(None),
    probation_start_date: Optional[str] = Form(None),
    probation_end_date: Optional[str] = Form(None),
    basic_salary: Optional[str] = Form(None),
    compensation_package: Optional[str] = Form(None),

    photo: Optional[UploadFile] = File(None),

    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_staff)
):
    """Create a new nurse user"""
    from app.models.branch import Branch

    if branch_id == "":
        branch_id = None

    # 1. Validate branch exists only if provided
    if branch_id:
        branch_query = select(Branch).where(Branch.id == branch_id)
        branch_result = await session.exec(branch_query)
        branch = branch_result.first()

        if not branch:
            logger.error(f"Branch not found: {branch_id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Branch with ID {branch_id} does not exist"
            )

    # 2. Check if user email already exists
    query = select(User).where(User.email == email)
    result = await session.exec(query)
    if result.first():
        logger.error(f"Email already exists: {email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )

    try:
        # 3. Create user with role_as = 4 (Nurse)
        user = User(
            first_name=first_name,
            last_name=last_name,
            email=email,
            hashed_password=get_password_hash(password),
            role_as=4,  # Nurse role
            branch_id=branch_id,
            date_of_birth=date_of_birth,
            gender=gender.lower() if gender else None,
            nic_number=nic_number,
            contact_number_mobile=contact_number_mobile,
            contact_number_landline=contact_number_landline,
            home_address=home_address,
            emergency_contact_info=emergency_contact_info,
            medical_registration_number=medical_registration_number,
            qualifications=qualifications,
            years_of_experience=int(years_of_experience) if years_of_experience and years_of_experience != '0' else None,
            license_validity_date=license_validity_date,
            joining_date=joining_date,
            employee_id=employee_id,
            contract_type=contract_type,
            probation_start_date=probation_start_date,
            probation_end_date=probation_end_date,
            basic_salary=float(basic_salary) if basic_salary else None,
            compensation_package=compensation_package,
            is_active=True
        )

        session.add(user)
        await session.commit()
        await session.refresh(user)

        logger.info(f"Nurse created successfully: {user.id}")
        return {
            "message": "Nurse created successfully",
            "user_id": user.id
        }

    except Exception as e:
        await session.rollback()
        logger.error(f"Error creating nurse: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create nurse: {str(e)}"
        )


# ──────────────────── Dashboard ────────────────────

@router.get("/dashboard-stats")
async def nurse_dashboard_stats(
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    """Nurse dashboard summary: today's vitals, pending handovers."""
    today = date.today()
    vitals_today = await session.exec(
        select(func.count(VitalSign.id))
        .where(VitalSign.nurse_id == user.id)
        .where(func.date(VitalSign.recorded_at) == today)
    )
    pending_handovers = await session.exec(
        select(func.count(NurseHandover.id))
        .where(NurseHandover.to_nurse_id == user.id, NurseHandover.status == "pending")
    )
    return {
        "vitalsRecordedToday": vitals_today.one() or 0,
        "pendingHandovers": pending_handovers.one() or 0,
    }


# ──────────────────── Vital Signs ────────────────────

@router.post("/vital-signs", response_model=VitalSignRead, status_code=201)
async def record_vital_signs(
    body: VitalSignCreate,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    data = body.model_dump()
    data["nurse_id"] = user.id
    vs = VitalSign(**data)
    session.add(vs)
    await session.commit()
    await session.refresh(vs)
    return vs


@router.get("/vital-signs", response_model=List[VitalSignRead])
async def list_vital_signs(
    patient_id: Optional[str] = None,
    skip: int = 0, limit: int = 50,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    q = select(VitalSign)
    if patient_id:
        q = q.where(VitalSign.patient_id == patient_id)
    q = q.order_by(VitalSign.recorded_at.desc()).offset(skip).limit(limit)  # type: ignore
    result = await session.exec(q)
    return list(result.all())


@router.get("/vital-signs/{vital_id}", response_model=VitalSignRead)
async def get_vital_sign(
    vital_id: str,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    vs = await session.get(VitalSign, vital_id)
    if not vs:
        raise HTTPException(404, "Vital sign record not found")
    return vs


@router.put("/vital-signs/{vital_id}", response_model=VitalSignRead)
async def update_vital_sign(
    vital_id: str,
    body: VitalSignCreate,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    vs = await session.get(VitalSign, vital_id)
    if not vs:
        raise HTTPException(404, "Vital sign record not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        if hasattr(vs, k) and k not in ("id", "created_at"):
            setattr(vs, k, v)
    session.add(vs)
    await session.commit()
    await session.refresh(vs)
    return vs


@router.delete("/vital-signs/{vital_id}")
async def delete_vital_sign(
    vital_id: str,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    vs = await session.get(VitalSign, vital_id)
    if not vs:
        raise HTTPException(404, "Vital sign record not found")
    await session.delete(vs)
    await session.commit()
    return {"detail": "Vital sign record deleted"}


@router.get("/patients/{patient_id}/vital-history", response_model=List[VitalSignRead])
async def patient_vital_history(
    patient_id: str,
    days: int = 30,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    """Get vital sign history for a patient over the last N days."""
    from datetime import timedelta
    cutoff = datetime.utcnow() - timedelta(days=days)
    result = await session.exec(
        select(VitalSign)
        .where(VitalSign.patient_id == patient_id, VitalSign.recorded_at >= cutoff)
        .order_by(VitalSign.recorded_at.desc())  # type: ignore
    )
    return list(result.all())


# ──────────────────── Handovers ────────────────────

@router.post("/handovers", response_model=NurseHandoverRead, status_code=201)
async def create_handover(
    body: NurseHandoverCreate,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    data = body.model_dump()
    data["from_nurse_id"] = user.id
    ho = NurseHandover(**data)
    session.add(ho)
    await session.commit()
    await session.refresh(ho)
    return ho


@router.get("/handovers", response_model=List[NurseHandoverRead])
async def list_handovers(
    pending_only: bool = False,
    skip: int = 0, limit: int = 50,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    q = select(NurseHandover).where(
        (NurseHandover.from_nurse_id == user.id) | (NurseHandover.to_nurse_id == user.id)
    )
    if pending_only:
        q = q.where(NurseHandover.status == "pending")
    q = q.order_by(NurseHandover.created_at.desc()).offset(skip).limit(limit)  # type: ignore
    result = await session.exec(q)
    return list(result.all())


@router.get("/handovers/{handover_id}", response_model=NurseHandoverRead)
async def get_handover(
    handover_id: str,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    ho = await session.get(NurseHandover, handover_id)
    if not ho:
        raise HTTPException(404, "Handover not found")
    return ho


@router.put("/handovers/{handover_id}/acknowledge", response_model=NurseHandoverRead)
async def acknowledge_handover(
    handover_id: str,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    ho = await session.get(NurseHandover, handover_id)
    if not ho:
        raise HTTPException(404, "Handover not found")
    if ho.to_nurse_id != user.id:
        raise HTTPException(403, "Only the receiving nurse can acknowledge")
    ho.status = "acknowledged"
    ho.acknowledged_at = datetime.utcnow()
    session.add(ho)
    await session.commit()
    await session.refresh(ho)
    return ho


# ──────────────────── Profile ────────────────────

@router.get("/profile")
async def nurse_profile(
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    return {
        "id": user.id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "branch_id": user.branch_id,
        "role_as": user.role_as,
    }


@router.get("/patients")
async def nurse_patients(
    branch_id: Optional[str] = None,
    skip: int = 0, limit: int = 50,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    """List patients (optionally filtered by branch)."""
    from app.models.patient import Patient
    q = select(Patient)
    if branch_id:
        q = q.where(Patient.branch_id == branch_id)
    q = q.offset(skip).limit(limit)
    result = await session.exec(q)
    return list(result.all())
