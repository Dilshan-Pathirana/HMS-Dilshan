from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from app.core.database import get_session
from app.models.user import User
from app.core.security import get_password_hash
from app.api.deps import get_current_active_staff
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
