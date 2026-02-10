from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select, col

from app.core.database import get_session
from app.models.branch import Branch, BranchCreate
from app.models.user import User
from app.api.deps import get_current_active_superuser, get_current_user

router = APIRouter()

from fastapi import Form

@router.post("/", response_model=Branch)
async def create_branch(
    center_name: str = Form(...),
    register_number: str = Form(None),
    center_type: str = Form(None),
    division: str = Form(None),
    division_number: str = Form(None),
    owner_type: str = Form(None),
    owner_full_name: str = Form(None),
    owner_id_number: str = Form(None),
    owner_contact_number: str = Form(None),
    register_document: UploadFile = File(None),
    branch_admin_id: str = Form(None), # Optional at creation
    current_user: User = Depends(get_current_active_superuser),
    session: AsyncSession = Depends(get_session)
):
    """
    Create a new branch (multipart/form-data).
    """
    # Check if center name exists
    query = select(Branch).where(Branch.center_name == center_name)
    result = await session.exec(query)
    if result.first():
        raise HTTPException(status_code=400, detail="Branch with this center name already exists")

    # Handle file upload (register_document)
    register_document_path = None
    if register_document:
        # Save file to disk or S3 as needed. Here, just save filename.
        register_document_path = register_document.filename

    branch_data = {
        "center_name": center_name,
        "register_number": register_number,
        "center_type": center_type,
        "division": division,
        "division_number": division_number,
        "owner_type": owner_type,
        "owner_full_name": owner_full_name,
        "owner_id_number": owner_id_number,
        "owner_contact_number": owner_contact_number,
        "register_document": register_document_path,
        "branch_admin_id": branch_admin_id,
    }

    # Verify branch_admin_id if provided
    if branch_admin_id:
        admin_user = await session.get(User, branch_admin_id)
        if not admin_user:
             raise HTTPException(status_code=400, detail="Branch Admin user not found")
        # Ensure user is a Branch Admin (Role 2)
        if admin_user.role_as != 2:
            raise HTTPException(status_code=400, detail="Selected user is not a Branch Admin")
        # Ensure they are not already assigned to another branch if strict 1-to-1 is enforced by logic

    branch = Branch(**branch_data)
    session.add(branch)
    await session.commit()
    await session.refresh(branch)

    # If admin assigned, update user's branch_id as well
    if branch_admin_id and admin_user:
        admin_user.branch_id = branch.id
        session.add(admin_user)
        await session.commit()

    return branch

@router.get("/", response_model=List[Branch])
async def read_branches(
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(get_session)
):
    """
    Retrieve branches.
    """
    query = select(Branch).offset(skip).limit(limit)
    result = await session.exec(query)
    return result.all()

@router.get("/{branch_id}", response_model=Branch)
async def read_branch(
    branch_id: str,
    session: AsyncSession = Depends(get_session)
):
    branch = await session.get(Branch, branch_id)
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    return branch

@router.delete("/{branch_id}")
async def delete_branch(
    branch_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser)
):
    branch = await session.get(Branch, branch_id)
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")

    # Prevent deleting patient/operational records implicitly.
    from app.models.appointment import Appointment
    from app.models.visit import Visit, Queue

    appt_check = await session.exec(
        select(Appointment.id).where(Appointment.branch_id == branch_id).limit(1)
    )
    if appt_check.first():
        raise HTTPException(
            status_code=409,
            detail="Cannot delete branch with existing appointments. Cancel/move them first.",
        )

    visit_check = await session.exec(
        select(Visit.id).where(Visit.branch_id == branch_id).limit(1)
    )
    if visit_check.first():
        raise HTTPException(
            status_code=409,
            detail="Cannot delete branch with existing visits. Archive/move them first.",
        )

    queue_check = await session.exec(
        select(Queue.id).where(Queue.branch_id == branch_id).limit(1)
    )
    if queue_check.first():
        raise HTTPException(
            status_code=409,
            detail="Cannot delete branch with existing queue records. Clear them first.",
        )

    # Unassign staff (users) and linked records.
    from app.models.user import User as UserModel
    from app.models.pharmacy import Pharmacy
    from app.models.doctor import Doctor
    from app.models.doctor_branch_link import DoctorBranchLink
    from app.models.doctor_availability import DoctorAvailability

    unassigned_users = 0
    unassigned_pharmacies = 0
    unassigned_doctors = 0
    deleted_availability = 0

    user_result = await session.exec(select(UserModel).where(UserModel.branch_id == branch_id))
    for u in user_result.all() or []:
        u.branch_id = None
        session.add(u)
        unassigned_users += 1

    pharmacy_result = await session.exec(select(Pharmacy).where(Pharmacy.branch_id == branch_id))
    for p in pharmacy_result.all() or []:
        p.branch_id = None
        session.add(p)
        unassigned_pharmacies += 1

    doctor_link_result = await session.exec(
        select(DoctorBranchLink).where(DoctorBranchLink.branch_id == branch_id)
    )
    for link in doctor_link_result.all() or []:
        await session.delete(link)
        unassigned_doctors += 1

    availability_result = await session.exec(
        select(DoctorAvailability).where(DoctorAvailability.branch_id == branch_id)
    )
    for a in availability_result.all() or []:
        await session.delete(a)
        deleted_availability += 1

    # Clear admin link (optional, but keeps data consistent in-session)
    branch.branch_admin_id = None
    session.add(branch)

    await session.delete(branch)
    await session.commit()
    return {
        "message": "Branch deleted successfully",
        "unassigned_users": unassigned_users,
        "unassigned_pharmacies": unassigned_pharmacies,
        "unassigned_doctors": unassigned_doctors,
        "deleted_availability": deleted_availability,
    }

@router.put("/{branch_id}", response_model=Branch)
async def update_branch(
    branch_id: str,
    center_name: str = Form(None),
    register_number: str = Form(None),
    center_type: str = Form(None),
    division: str = Form(None),
    division_number: str = Form(None),
    owner_type: str = Form(None),
    owner_full_name: str = Form(None),
    owner_id_number: str = Form(None),
    owner_contact_number: str = Form(None),
    register_document: UploadFile = File(None),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser)
):
    branch = await session.get(Branch, branch_id)
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")

    # Update fields if provided
    if center_name is not None:
        branch.center_name = center_name
    if register_number is not None:
        branch.register_number = register_number
    if center_type is not None:
        branch.center_type = center_type
    if division is not None:
        branch.division = division
    if division_number is not None:
        branch.division_number = division_number
    if owner_type is not None:
        branch.owner_type = owner_type
    if owner_full_name is not None:
        branch.owner_full_name = owner_full_name
    if owner_id_number is not None:
        branch.owner_id_number = owner_id_number
    if owner_contact_number is not None:
        branch.owner_contact_number = owner_contact_number

    if register_document:
        # In a real app, save the file. For now, store filename.
        branch.register_document = register_document.filename

    session.add(branch)
    try:
        await session.commit()
        await session.refresh(branch)
    except Exception as e:
        await session.rollback()
        # Handle unique constraint violation likelihood
        raise HTTPException(status_code=400, detail="Update failed. potentially duplicate unique fields.")

    return branch

@router.put("/{branch_id}/assign-admin", response_model=Branch)
async def assign_branch_admin(
    branch_id: str,
    admin_id: str = Form(...),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser)
):
    """
    Assign a Branch Admin to a branch.
    Enforces 1-to-1 relationship if required by logic (Branch can have only 1 admin, logic below).
    """
    branch = await session.get(Branch, branch_id)
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")

    user = await session.get(User, admin_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Frontend mapping: BranchAdmin = 2
    if user.role_as != 2:
         raise HTTPException(status_code=400, detail="User is not a Branch Admin")

    # Logic: If Branch had an admin, should we unassign?
    # For now, just overwrite.

    # Logic: If User was assigned to another branch?
    if user.branch_id and user.branch_id != branch_id:
        raise HTTPException(status_code=400, detail="User is already assigned to another branch")

    # Update Branch
    branch.branch_admin_id = admin_id

    # Update User
    user.branch_id = branch_id
    session.add(user)
    session.add(branch)

    try:
        await session.commit()
        await session.refresh(branch)
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail=str(e))

    return branch


# ============================================
# Staff Assignment Endpoints
# ============================================

from pydantic import BaseModel

class StaffAssignment(BaseModel):
    user_id: str
    role: str  # e.g., "branch_admin", "pharmacist", "staff"

@router.post("/{branch_id}/assign-staff")
async def assign_staff_to_branch(
    branch_id: str,
    assignment: StaffAssignment,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser)
):
    """
    Assign a user (pharmacist, branch admin, or staff) to a branch.
    """
    # Verify branch exists
    branch = await session.get(Branch, branch_id)
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")

    # Verify user exists
    user = await session.get(User, assignment.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Role-aware assignment
    if assignment.role == "doctor":
        from app.models.doctor import Doctor
        from app.models.doctor_branch_link import DoctorBranchLink

        doctor_result = await session.exec(select(Doctor).where(Doctor.user_id == user.id))
        doctor = doctor_result.first()
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor profile not found for user")

        link_result = await session.exec(
            select(DoctorBranchLink)
            .where(DoctorBranchLink.doctor_id == doctor.id)
            .where(DoctorBranchLink.branch_id == branch_id)
        )
        existing_link = link_result.first()
        if not existing_link:
            session.add(DoctorBranchLink(doctor_id=doctor.id, branch_id=branch_id))
    else:
        # Always assign non-doctor staff via user.branch_id
        user.branch_id = branch_id
        session.add(user)

        # If assigning a Branch Admin, also update Branch.branch_admin_id
        if assignment.role == "branch_admin":
            branch.branch_admin_id = assignment.user_id
            session.add(branch)
    try:
        await session.commit()
        await session.refresh(user)
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to assign staff: {str(e)}")

    return {
        "message": f"User {user.email} assigned to branch {branch.center_name} as {assignment.role}",
        "branch_id": branch_id,
        "user_id": assignment.user_id,
        "role": assignment.role
    }


@router.get("/{branch_id}/staff")
async def get_branch_staff(
    branch_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser)
):
    """
    Get all staff assigned to a branch.
    """
    # Verify branch exists
    branch = await session.get(Branch, branch_id)
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")

    # Query users with this branch_id, excluding the admin (optional, but good for separation)
    # Admin is usually stored in branch.branch_admin_id, but also has branch_id set.
    # Let's return all users linked to this branch.
    query = select(User).where(User.branch_id == branch_id)
    result = await session.exec(query)
    staff_members = result.all() or []

    # Add doctors assigned via the doctor-branch link table
    from app.models.doctor import Doctor
    from app.models.doctor_branch_link import DoctorBranchLink

    doctor_users_result = await session.exec(
        select(User)
        .join(Doctor, col(Doctor.user_id) == User.id)
        .join(DoctorBranchLink, col(DoctorBranchLink.doctor_id) == Doctor.id)
        .where(DoctorBranchLink.branch_id == branch_id)
    )
    doctor_users = doctor_users_result.all() or []

    combined = {u.id: u for u in staff_members}
    for u in doctor_users:
        combined[u.id] = u

    return list(combined.values())


@router.delete("/{branch_id}/staff/{user_id}")
async def remove_staff_from_branch(
    branch_id: str,
    user_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser)
):
    """
    Remove a staff member from a branch.
    """
    # Verify branch exists
    branch = await session.get(Branch, branch_id)
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")

    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.role_as == 3:
        from app.models.doctor import Doctor
        from app.models.doctor_branch_link import DoctorBranchLink

        doctor_result = await session.exec(select(Doctor).where(Doctor.user_id == user.id))
        doctor = doctor_result.first()
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor profile not found for user")

        link_result = await session.exec(
            select(DoctorBranchLink)
            .where(DoctorBranchLink.doctor_id == doctor.id)
            .where(DoctorBranchLink.branch_id == branch_id)
        )
        link = link_result.first()
        if not link:
            raise HTTPException(status_code=400, detail="Doctor is not assigned to this branch")

        await session.delete(link)
    else:
        if user.branch_id != branch_id:
            raise HTTPException(status_code=400, detail="User is not assigned to this branch")

        # If this user is the branch admin, clear that link too
        if getattr(branch, "branch_admin_id", None) == user_id:
            branch.branch_admin_id = None
            session.add(branch)

        # Unassign user from branch
        user.branch_id = None
        session.add(user)

    await session.commit()

    return {
        "message": f"Staff member removed from branch {branch.center_name}",
        "branch_id": branch_id,
        "user_id": user_id
    }

# ============================================
# Pharmacy Assignment Endpoints (New)
# ============================================

from app.models.pharmacy import Pharmacy

@router.put("/{branch_id}/pharmacies/{pharmacy_id}")
async def assign_pharmacy_to_branch(
    branch_id: str,
    pharmacy_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser)
):
    """
    Link a pharmacy to a branch.
    """
    branch = await session.get(Branch, branch_id)
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")

    pharmacy = await session.get(Pharmacy, pharmacy_id)
    if not pharmacy:
        raise HTTPException(status_code=404, detail="Pharmacy not found")

    # Check if pharmacy is already assigned to ANOTHER branch
    if pharmacy.branch_id and pharmacy.branch_id != branch_id:
        raise HTTPException(status_code=400, detail="Pharmacy is already assigned to another branch")

    pharmacy.branch_id = branch_id
    session.add(pharmacy)
    await session.commit()
    await session.refresh(pharmacy)

    return {"message": "Pharmacy assigned to branch successfully", "pharmacy_id": pharmacy.id, "branch_id": branch.id}

@router.delete("/{branch_id}/pharmacies/{pharmacy_id}")
async def unassign_pharmacy_from_branch(
    branch_id: str,
    pharmacy_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser)
):
    """
    Unlink a pharmacy from a branch.
    """
    branch = await session.get(Branch, branch_id)
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")

    pharmacy = await session.get(Pharmacy, pharmacy_id)
    if not pharmacy:
        raise HTTPException(status_code=404, detail="Pharmacy not found")

    if pharmacy.branch_id != branch_id:
        raise HTTPException(status_code=400, detail="Pharmacy is not assigned to this branch")

    pharmacy.branch_id = None
    session.add(pharmacy)
    await session.commit()

    return {"message": "Pharmacy unassigned from branch successfully"}

@router.get("/{branch_id}/details")
async def get_branch_details_full(
    branch_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    print(f"DEBUG: get_branch_details_full hit. ID: {branch_id}", flush=True)
    print(f"DEBUG: Current User: {current_user.email} (Role: {current_user.role_as})", flush=True)

    """
    Get full branch details including Admin, Staff count, and Assigned Pharmacies.
    Accessible by Super Admin (1) and the specific Branch Admin (2) of this branch.
    """
    branch = await session.get(Branch, branch_id)
    if not branch:
        print("DEBUG: Branch not found in DB")
        raise HTTPException(status_code=404, detail="Branch not found")

    print(f"DEBUG: Branch found: {branch.center_name}")

    # Access Control
    if current_user.role_as == 1:
        # Super Admin - Access Granted
        pass
    elif current_user.role_as == 2:
        # Branch Admin - Check if assigned to this branch
        if current_user.branch_id != branch_id:
             print("DEBUG: Access Denied for Branch Admin")
             raise HTTPException(status_code=403, detail="You are not authorized to view this branch.")
    else:
        # Other roles
        if current_user.branch_id != branch_id:
            print(f"DEBUG: Access Denied for role {current_user.role_as}")
            raise HTTPException(status_code=403, detail="You are not authorized to view this branch.")


    # Load Admin
    admin_user = None
    if branch.branch_admin_id:
        admin_user = await session.get(User, branch.branch_admin_id)

    # Load Pharmacies
    query_pharm = select(Pharmacy).where(Pharmacy.branch_id == branch_id)
    result_pharm = await session.exec(query_pharm)
    pharmacies = result_pharm.all()

    response_data = {
        "id": branch.id,
        "center_name": branch.center_name,
        "register_number": branch.register_number,
        "register_document": branch.register_document,
        "center_type": branch.center_type,
        "division": branch.division,
        "division_number": branch.division_number,
        "owner_type": branch.owner_type,
        "owner_full_name": branch.owner_full_name,
        "owner_id_number": branch.owner_id_number,
        "owner_contact_number": branch.owner_contact_number,
        "branch_admin": admin_user,
        "pharmacies": pharmacies,
    }
    print(f"DEBUG: Returning response data: {response_data}", flush=True)

    # Validation: Ensure we are not returning something that breaks
    try:
        from fastapi.encoders import jsonable_encoder
        json_compatible_item_data = jsonable_encoder(response_data)
        print("DEBUG: Serialization successful", flush=True)
        return json_compatible_item_data
    except Exception as e:
        print(f"DEBUG: Serialization FAILED: {e}", flush=True)
        # Fallback to simple dict
        return {
             "id": branch.id,
             "center_name": branch.center_name,
             "error": "Serialization failed"
        }
