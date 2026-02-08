from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from app.core.database import get_session
from app.models.user import User, UserCreate
from app.models.staff_pharmacist import Pharmacist, PharmacistCreate
from app.core.security import get_password_hash
from app.api.deps import get_current_active_staff
import shutil
import os
from uuid import uuid4
from datetime import datetime

router = APIRouter()

UPLOAD_DIR = "uploads/pharmacists"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/create-pharmacist", response_model=dict)
async def create_pharmacist(
    first_name: str = Form(...),
    last_name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    # branch_id removed
    date_of_birth: Optional[str] = Form(None),
    
    gender: Optional[str] = Form(None),
    nic_number: Optional[str] = Form(None),
    contact_number_mobile: Optional[str] = Form(None),
    contact_number_landline: Optional[str] = Form(None),
    home_address: Optional[str] = Form(None),
    emergency_contact_info: Optional[str] = Form(None),
    
    pharmacist_registration_number: Optional[str] = Form(None),
    work_experience: Optional[str] = Form(None),
    years_of_experience: Optional[str] = Form(None),
    previous_employment: Optional[str] = Form(None),
    license_validity_date: Optional[str] = Form(None),
    qualifications: Optional[str] = Form(None),
    joining_date: Optional[str] = Form(None),
    contract_type: Optional[str] = Form(None),
    contract_duration: Optional[str] = Form(None),
    probation_start_date: Optional[str] = Form(None),
    probation_end_date: Optional[str] = Form(None),
    basic_salary: Optional[str] = Form(None),
    compensation_package: Optional[str] = Form(None),
    
    photo: Optional[UploadFile] = File(None),
    nic_photo: Optional[UploadFile] = File(None),
    
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_staff)
):
    from app.models.branch import Branch
    import logging
    logger = logging.getLogger(__name__)
    
    # 1. Removed Branch validation as Pharmacists are independent
    # branch_query = select(Branch).where(Branch.id == branch_id)
    # ...
    # branch = branch_result.first()
    
    # if not branch:
    #     ...
    
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
        # 2. Create User account (Role 7 = Pharmacist)
        hashed_password = get_password_hash(password)
        new_user = User(
            email=email,
            username=email, # Using email as username for simplicity
            hashed_password=hashed_password,
            role_as=5, # Pharmacist role
            is_active=True
        )
        
        session.add(new_user)
        await session.commit()
        await session.refresh(new_user)
        
        # 3. Handle File Uploads
        photo_path = None
        nic_photo_path = None
        
        if photo:
            file_ext = photo.filename.split(".")[-1]
            file_name = f"{new_user.id}_photo.{file_ext}"
            file_path = os.path.join(UPLOAD_DIR, file_name)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(photo.file, buffer)
            photo_path = file_path

        if nic_photo:
            file_ext = nic_photo.filename.split(".")[-1]
            file_name = f"{new_user.id}_nic.{file_ext}"
            file_path = os.path.join(UPLOAD_DIR, file_name)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(nic_photo.file, buffer)
            nic_photo_path = file_path

        # Helper to parse dates safely
        def parse_date(date_str):
            if not date_str or date_str == "null" or date_str == "undefined":
                return None
            try:
                return datetime.strptime(date_str, "%Y-%m-%d").date()
            except ValueError:
                return None

        def parse_int(value):
            if not value:
                return 0
            try:
                return int(value)
            except ValueError:
                return 0

        def parse_float(value):
            if not value:
                return 0.0
            try:
                return float(value)
            except ValueError:
                return 0.0

        # 4. Create Pharmacist Profile
        new_pharmacist = Pharmacist(
            user_id=new_user.id,
            # branch_id removed
            first_name=first_name,
            last_name=last_name,
            date_of_birth=parse_date(date_of_birth),
            gender=gender,
            nic_number=nic_number,
            contact_number_mobile=contact_number_mobile,
            contact_number_landline=contact_number_landline,
            home_address=home_address,
            emergency_contact_info=emergency_contact_info,
            pharmacist_registration_number=pharmacist_registration_number,
            work_experience=work_experience,
            years_of_experience=parse_int(years_of_experience),
            previous_employment=previous_employment,
            license_validity_date=parse_date(license_validity_date),
            qualifications=qualifications,
            joining_date=parse_date(joining_date),
            contract_type=contract_type,
            contract_duration=contract_duration,
            probation_start_date=parse_date(probation_start_date),
            probation_end_date=parse_date(probation_end_date),
            basic_salary=parse_float(basic_salary),
            compensation_package=compensation_package,
            photo_path=photo_path,
            nic_photo_path=nic_photo_path
        )
        
        session.add(new_pharmacist)
        await session.commit()
        
        logger.info(f"Pharmacist created successfully: {new_pharmacist.id}")
        return {"message": "Pharmacist created successfully", "pharmacist_id": new_pharmacist.id, "user_id": new_user.id}
    
    except Exception as e:
        await session.rollback()
        logger.error(f"Error creating pharmacist: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create pharmacist: {str(e)}"
        )
