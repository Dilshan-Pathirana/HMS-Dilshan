from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select

from app.core.database import get_session
from app.models.branch import Branch, BranchCreate
from app.models.user import User
from app.api.deps import get_current_active_superuser

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
    }
    branch = Branch(**branch_data)
    session.add(branch)
    await session.commit()
    await session.refresh(branch)
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
    await session.delete(branch)
    await session.commit()
    await session.commit()
    return {"message": "Branch deleted successfully"}

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
