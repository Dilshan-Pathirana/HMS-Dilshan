from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from app.core.database import get_session
from app.models.user import User
from app.core.security import get_password_hash
from app.api.deps import get_current_active_staff
from app.api.uploads import validate_file, save_file, PHOTO_ALLOWED_EXTENSIONS, PHOTO_MAX_SIZE, ID_ALLOWED_EXTENSIONS, ID_MAX_SIZE
import logging

router = APIRouter()
logging.basicConfig(filename='debug_staff.log', level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Map user types to role_as values
USER_TYPE_ROLES = {
    # Core roles used by the frontend (source of truth)
    # 1: Super Admin, 2: Branch Admin, 3: Doctor, 4: Nurse, 5: Patient,
    # 6: Cashier, 7: Pharmacist, 8: IT Support, 9: Center Aid, 10: Auditor
    "Branch Admin": 2,
    "Nurse": 4,
    "Cashier": 6,
    # Receptionist UI is handled under cashier role (frontend branches by user_type)
    "Receptionist": 6,
    "IT Assistant": 8,
    "IT Support": 8,
    "Center Aids": 9,
    "Center Aid": 9,
    "Auditor": 10,
    # Optional/legacy roles
    "Pharmacist": 7,
    "Supplier": 8,
    "Support Staff": 12,
    "Therapist": 13,
    "Radiology/Imaging Technologist": 14,
    "Medical Technologist": 15,
    "Phlebotomist": 16,
    "Surgical Technologist": 17,
    "Counselor": 18,
    "HRM Manager": 19,
    "Dietitian": 20,
    "Paramedic/EMT": 21,
    "Audiologist": 22,
    "Medical Assistant": 23,
    "Clerk": 24,
    "Director": 25,
    "Secretary": 26
}

@router.post("/create-staff", response_model=dict)
async def create_staff(
    user_type: str = Form(...),
    first_name: str = Form(...),
    last_name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),

    # Optional fields
    branch_id: Optional[str] = Form(None),
    date_of_birth: Optional[str] = Form(None),
    gender: Optional[str] = Form(None),
    nic: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    address: Optional[str] = Form(None),

    # Employment fields
    joining_date: Optional[str] = Form(None),
    basic_salary: Optional[str] = Form(None),
    employee_id: Optional[str] = Form(None),
    contract_type: Optional[str] = Form(None),

    # Additional fields that might come from different forms
    nic_number: Optional[str] = Form(None),
    contact_number_mobile: Optional[str] = Form(None),
    contact_number_landline: Optional[str] = Form(None),
    home_address: Optional[str] = Form(None),
    emergency_contact_info: Optional[str] = Form(None),
    qualifications: Optional[str] = Form(None),
    years_of_experience: Optional[str] = Form(None),
    contract_duration: Optional[str] = Form(None),
    compensation_package: Optional[str] = Form(None),

    photo: Optional[UploadFile] = File(None),
    nic_photo: Optional[UploadFile] = File(None),

    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_staff)
):
    """
    Generic endpoint to create staff users of various types
    Handles: Cashier, Branch Admin, IT Support, Receptionist, Supplier, Auditor, and others
    """

    # 1. Validate user type
    if user_type not in USER_TYPE_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid user type: {user_type}"
        )

    role_as = USER_TYPE_ROLES[user_type]

    if branch_id == "":
        branch_id = None

    # 2. Validate branch when provided, and require it for certain roles (e.g., Nurse)
    if user_type == "Nurse" and not branch_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nurse users must be assigned to a branch")

    if branch_id:
        if user_type == "Pharmacist":
            raise HTTPException(status_code=400, detail="Pharmacists cannot be assigned to a branch.")

        from app.models.branch import Branch
        branch_query = select(Branch).where(Branch.id == branch_id)
        branch_result = await session.exec(branch_query)
        branch = branch_result.first()

        if not branch:
            logger.error(f"Branch not found: {branch_id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Branch with ID {branch_id} does not exist"
            )

    # 3. Check if user email already exists
    query = select(User).where(User.email == email)
    result = await session.exec(query)
    if result.first():
        logger.error(f"Email already exists: {email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )

    try:
        # Normalize field names (handle both naming conventions)
        final_nic = nic_number or nic
        final_phone = contact_number_mobile or phone
        final_address = home_address or address

        # Process file uploads
        photo_path = None
        nic_photo_path = None

        if photo and photo.filename:
            ext = validate_file(photo, PHOTO_ALLOWED_EXTENSIONS, PHOTO_MAX_SIZE, "photo")
            photo_path = save_file(photo, "photos", ext)

        if nic_photo and nic_photo.filename:
            ext = validate_file(nic_photo, ID_ALLOWED_EXTENSIONS, ID_MAX_SIZE, "nic_photo")
            nic_photo_path = save_file(nic_photo, "id_documents", ext)

        # 4. Create user
        user = User(
            first_name=first_name,
            last_name=last_name,
            email=email,
            username=email, # Using email as username
            hashed_password=get_password_hash(password),
            role_as=role_as,
            branch_id=branch_id,
            date_of_birth=date_of_birth,
            gender=gender.lower() if gender else None,
            nic_number=final_nic,
            contact_number_mobile=final_phone,
            contact_number_landline=contact_number_landline,
            home_address=final_address,
            emergency_contact_info=emergency_contact_info,
            qualifications=qualifications,
            years_of_experience=int(years_of_experience) if years_of_experience and years_of_experience != '0' else None,
            joining_date=joining_date,
            employee_id=employee_id,
            contract_type=contract_type or 'full-time',
            contract_duration=contract_duration,
            basic_salary=float(basic_salary) if basic_salary else None,
            compensation_package=compensation_package,
            photo_path=photo_path,
            nic_photo_path=nic_photo_path,
            is_active=True
        )

        session.add(user)
        await session.commit()
        await session.refresh(user)

        logger.info(f"{user_type} created successfully: {user.id}")
        return {
            "message": f"{user_type} created successfully",
            "user_id": user.id,
            "role_as": user.role_as,
            "user_type": user_type,
            "email": user.email,
        }

    except Exception as e:
        await session.rollback()
        import traceback
        logger.error(f"Error creating {user_type}: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create {user_type}: {str(e)}"
        )
