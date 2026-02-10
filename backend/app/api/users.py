from typing import List, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select, col

from app.core.database import get_session
from app.models.user import User, UserCreate, UserRead, UserUpdate
from app.models.patient import Patient
from app.api.deps import get_current_active_superuser, get_current_user
from app.core.security import get_password_hash
from app.core.config import settings
from app.services.sms_service import SmsService

router = APIRouter()


class PatientSignupRequest(BaseModel):
    first_name: str
    last_name: str
    phone: str
    NIC: str
    password: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    blood_type: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    branch_id: Optional[str] = None

@router.get("/me", response_model=UserRead)
async def read_user_me(
    current_user: User = Depends(get_current_user)
):
    """
    Get current user.
    """
    return current_user

@router.post("/", response_model=UserRead)
async def create_user(
    user_in: UserCreate,
    current_user: User = Depends(get_current_active_superuser),
    session: AsyncSession = Depends(get_session)
):
    query = select(User).where(User.email == user_in.email)
    result = await session.exec(query)
    if result.first():
        raise HTTPException(status_code=400, detail="The user with this email already exists")

    # Create user dict excluding strict password field if it exists in dict vs model mismatch
    user_data = user_in.model_dump(exclude={"password"})
    user = User(**user_data, hashed_password=get_password_hash(user_in.password))

    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


@router.post("/patients")
async def register_patient_user(
    payload: PatientSignupRequest,
    session: AsyncSession = Depends(get_session),
):
    email = (payload.email or "").strip().lower()
    phone = (payload.phone or "").strip()
    nic = (payload.NIC or "").strip()
    branch_id = (payload.branch_id or "").strip() or None
    if not email:
        email = f"patient_{uuid4().hex[:8]}@guest.local"

    home_address = payload.address or None
    if payload.city:
        home_address = f"{payload.address or ''}{', ' if payload.address else ''}{payload.city}"

    emergency_contact = None
    if payload.emergency_contact_name or payload.emergency_contact_phone:
        name = payload.emergency_contact_name or ""
        phone = payload.emergency_contact_phone or ""
        emergency_contact = f"{name} {phone}".strip()

    existing_user: Optional[User] = None
    if email:
        existing_email = await session.exec(select(User).where(User.email == email))
        existing_user = existing_email.first()

    if phone:
        existing_phone = await session.exec(
            select(User).where(User.contact_number_mobile == phone)
        )
        user_by_phone = existing_phone.first()
        if user_by_phone and existing_user and user_by_phone.id != existing_user.id:
            raise HTTPException(status_code=400, detail="Phone number already registered")
        existing_user = existing_user or user_by_phone

    if nic:
        existing_nic = await session.exec(
            select(User).where(User.nic_number == nic)
        )
        user_by_nic = existing_nic.first()
        if user_by_nic and existing_user and user_by_nic.id != existing_user.id:
            raise HTTPException(status_code=400, detail="NIC already registered")
        existing_user = existing_user or user_by_nic

    if existing_user:
        if existing_user.role_as != 5:
            raise HTTPException(status_code=400, detail="Credentials already registered")
        if payload.first_name:
            existing_user.first_name = payload.first_name
        if payload.last_name:
            existing_user.last_name = payload.last_name
        if phone:
            existing_user.contact_number_mobile = phone
        if nic:
            existing_user.nic_number = nic
        if payload.date_of_birth:
            existing_user.date_of_birth = payload.date_of_birth
        if payload.gender:
            existing_user.gender = payload.gender
        if home_address:
            existing_user.home_address = home_address
        if emergency_contact:
            existing_user.emergency_contact_info = emergency_contact
        if branch_id:
            existing_user.branch_id = branch_id
        session.add(existing_user)
        patient_res = await session.exec(select(Patient).where(Patient.user_id == existing_user.id))
        patient = patient_res.first()
        if not patient:
            patient = Patient(
                user_id=existing_user.id,
                gender=payload.gender,
                blood_group=payload.blood_type,
                address=home_address or payload.address,
                contact_number=phone or None,
                emergency_contact=emergency_contact or payload.emergency_contact_phone,
            )
            session.add(patient)
        else:
            if payload.gender:
                patient.gender = payload.gender
            if payload.blood_type:
                patient.blood_group = payload.blood_type
            if home_address:
                patient.address = home_address
            if phone:
                patient.contact_number = phone
            if emergency_contact:
                patient.emergency_contact = emergency_contact
            session.add(patient)
        await session.commit()
        await session.refresh(patient)
        return {
            "status": 200,
            "message": "Account already exists",
            "user_id": existing_user.id,
            "patient_id": patient.id,
        }

    generated_password = uuid4().hex[:10]
    if payload.password and payload.password.strip():
        generated_password = payload.password.strip()
    user = User(
        email=email,
        username=email,
        hashed_password=get_password_hash(generated_password),
        role_as=5,
        is_active=True,
        first_name=payload.first_name,
        last_name=payload.last_name,
        contact_number_mobile=phone or None,
        nic_number=nic or None,
        date_of_birth=payload.date_of_birth,
        gender=payload.gender,
        home_address=home_address,
        emergency_contact_info=emergency_contact,
        branch_id=branch_id,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)

    patient = Patient(
        user_id=user.id,
        gender=payload.gender,
        blood_group=payload.blood_type,
        address=home_address or payload.address,
        contact_number=payload.phone,
        emergency_contact=emergency_contact or payload.emergency_contact_phone,
    )
    session.add(patient)
    await session.commit()
    await session.refresh(patient)

    sms_status = None
    sms_log_id = None
    sms_error = None
    if phone:
        try:
            log = await SmsService.send_templated_sms(
                session,
                phone,
                "credentials",
                hospital_name=settings.PROJECT_NAME,
                email=user.email,
                password=generated_password,
            )
            sms_status = log.status
            sms_log_id = log.id
        except ValueError as exc:
            sms_status = "failed"
            sms_error = str(exc)

    return {
        "status": 200,
        "message": "Account created successfully",
        "user_id": user.id,
        "patient_id": patient.id,
        "credentials": {
            "email": user.email,
            "password": generated_password,
        },
        "sms": {
            "status": sms_status,
            "log_id": sms_log_id,
            "error": sms_error,
        },
    }

@router.get("/", response_model=List[UserRead])
async def read_users(
    skip: int = 0,
    limit: int = 100,
    branch_id: str | None = None,
    role_as: int | None = Query(default=None),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser)
):
    query = select(User)
    if branch_id:
        query = query.where(User.branch_id == branch_id)
    if role_as is not None:
        query = query.where(User.role_as == role_as)
    query = query.offset(skip).limit(limit)
    result = await session.exec(query)
    return result.all()

@router.put("/{user_id}", response_model=UserRead)
async def update_user(
    user_id: str,
    user_in: UserUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser)
):
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user_in.email is not None:
        user.email = user_in.email
    if user_in.username is not None:
        user.username = user_in.username
    if user_in.role_as is not None:
        user.role_as = user_in.role_as
    if user_in.branch_id is not None:
        user.branch_id = user_in.branch_id
    if user_in.is_active is not None:
        user.is_active = user_in.is_active
    if user_in.password is not None:
        user.hashed_password = get_password_hash(user_in.password)

    session.add(user)
    try:
        await session.commit()
        await session.refresh(user)
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail="Update failed. Username or email might already exist.")
    return user

@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser)
):
    import logging
    logger = logging.getLogger(__name__)

    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        # Clear / delete dependent records that reference this user to avoid FK constraint errors.
        # (MySQL defaults to RESTRICT unless FK is configured with ON DELETE CASCADE.)

        # If this user is assigned as a Branch Admin, clear the branch reference
        from app.models.branch import Branch
        branch_query = select(Branch).where(Branch.branch_admin_id == user_id)
        branch_result = await session.exec(branch_query)
        branches = branch_result.all() or []
        for branch in branches:
            logger.info(f"Clearing branch_admin_id for branch {branch.id} (user {user_id})")
            branch.branch_admin_id = None
            session.add(branch)

        # If this user is assigned as a Pharmacist to a Pharmacy, clear that reference
        from app.models.pharmacy import Pharmacy
        pharmacy_query = select(Pharmacy).where(Pharmacy.pharmacist_id == user_id)
        pharmacy_result = await session.exec(pharmacy_query)
        pharmacies = pharmacy_result.all() or []
        for pharmacy in pharmacies:
            logger.info(f"Clearing pharmacist_id for pharmacy {pharmacy.id} (user {user_id})")
            pharmacy.pharmacist_id = None
            session.add(pharmacy)

        # Delete Doctor profile if exists
        from app.models.doctor import Doctor
        doctor_query = select(Doctor).where(Doctor.user_id == user_id)
        doctor_result = await session.exec(doctor_query)
        doctor = doctor_result.first()
        if doctor:
            logger.info(f"Deleting doctor record for user {user_id}")
            await session.delete(doctor)

        # Delete Patient profile if exists
        from app.models.patient import Patient
        patient_query = select(Patient).where(Patient.user_id == user_id)
        patient_result = await session.exec(patient_query)
        patient = patient_result.first()
        if patient:
            logger.info(f"Deleting patient record for user {user_id}")
            await session.delete(patient)

        # Check if user has a pharmacist record and delete it first
        from app.models.staff_pharmacist import Pharmacist
        pharmacist_query = select(Pharmacist).where(Pharmacist.user_id == user_id)
        pharmacist_result = await session.exec(pharmacist_query)
        pharmacist = pharmacist_result.first()

        if pharmacist:
            logger.info(f"Deleting pharmacist record for user {user_id}")
            await session.delete(pharmacist)

        # Now safe to delete the user
        await session.delete(user)
        await session.commit()
        return {"message": "User deleted successfully"}
    except Exception as e:
        await session.rollback()
        logger.error(f"Error deleting user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete user: {str(e)}"
        )




@router.get("/available-branch-admins", response_model=List[UserRead])
async def get_available_branch_admins(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser)
):
    """
    Get all Branch Admins (role_as=2) who are NOT assigned to any branch.
    Check two things:
    1. User.branch_id is None (if we rely on User.branch_id)
    2. Branch.branch_admin_id does not reference them.
    """
    # Frontend mapping: BranchAdmin = 2
    query = select(User).where(User.role_as == 2).where(User.branch_id == None)
    result = await session.exec(query)
    admins = result.all()

    # Filter those who are already assigned to a branch
    # Strategy: Get all branch_admin_ids from Branch table
    from app.models.branch import Branch
    branch_query = select(Branch.branch_admin_id).where(Branch.branch_admin_id != None)
    branch_result = await session.exec(branch_query)
    assigned_ids = set([str(x) for x in branch_result.all() if x])

    return [admin for admin in admins if str(admin.id) not in assigned_ids]


@router.get("/available-by-role", response_model=List[UserRead])
async def get_available_users_by_role(
    role_as: int = Query(..., description="User role_as value"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser)
):
    """
    Get users of a specific role who are not assigned to any branch.
    For Branch Admin (role_as=2), also exclude users already referenced by Branch.branch_admin_id.
    For Pharmacist (role_as=7), also exclude users already referenced by Pharmacy.pharmacist_id.
    """

    query = select(User).where(User.role_as == role_as).where(User.branch_id == None)
    result = await session.exec(query)
    users = result.all() or []

    # Exclude Branch Admins already assigned in Branch table
    if role_as == 2:
        from app.models.branch import Branch
        branch_query = select(Branch.branch_admin_id).where(Branch.branch_admin_id != None)
        branch_result = await session.exec(branch_query)
        assigned_ids = {str(x) for x in branch_result.all() if x}
        users = [u for u in users if str(u.id) not in assigned_ids]

    # Exclude Pharmacists already assigned to a Pharmacy (if model uses that FK)
    if role_as == 7:
        from app.models.pharmacy import Pharmacy
        pharmacy_query = select(Pharmacy.pharmacist_id).where(Pharmacy.pharmacist_id != None)
        pharmacy_result = await session.exec(pharmacy_query)
        assigned_ids = {str(x) for x in pharmacy_result.all() if x}
        users = [u for u in users if str(u.id) not in assigned_ids]

    return users


@router.get("/available-staff", response_model=List[UserRead])
async def get_available_staff(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser)
):
    """
    Get unassigned operational staff (Doctors, Nurses, etc).
    Exclude: SuperAdmin(1), BranchAdmin(2), Pharmacist(7).
    And must not have branch_id.
    """
    # Excluded roles
    excluded_roles = [1, 2, 7]

    query = select(User).where(col(User.role_as).notin_(excluded_roles)).where(User.branch_id == None)
    result = await session.exec(query)
    return result.all()


@router.get("/{user_id}", response_model=UserRead)
async def read_user(
    user_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser)
):
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
