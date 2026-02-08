from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select, col

from app.core.database import get_session
from app.models.user import User, UserCreate, UserRead, UserUpdate
from app.api.deps import get_current_active_superuser, get_current_user
from app.core.security import get_password_hash

router = APIRouter()

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
