from typing import List, Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select, col

from app.core.database import get_session
from app.api.deps import get_current_active_superuser
from app.models.pharmacy import Pharmacy, PharmacyCreate, PharmacyRead, PharmacyUpdate
from app.models.user import User
from app.models.branch import Branch
# Models for products/suppliers would be needed here, mocking for now as they likely don't exist yet
# from app.models.product import Product 
# from app.models.supplier import Supplier

router = APIRouter()
import logging
logging.basicConfig(filename='debug_pharmacies.log', level=logging.DEBUG)
logger = logging.getLogger(__name__)

@router.get("/", response_model=Dict[str, Any])
async def read_pharmacies(
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser),
):
    """
    Retrieve pharmacies.
    """
    query = select(Pharmacy).offset(skip).limit(limit)
    result = await session.exec(query)
    pharmacies = result.all()
    
    # Enrich with branch and pharmacist names
    # In a real app with SQLModel relationships this would be automatic or via join
    # For now manual enrichment to match frontend expectation
    enriched_pharmacies = []
    for p in pharmacies:
        p_read = PharmacyRead.from_orm(p)
        if p.pharmacist_id:
            # Fetch Pharmacist profile to get the name
            from app.models.staff_pharmacist import Pharmacist as StaffPharmacist
            query_staff = select(StaffPharmacist).where(StaffPharmacist.user_id == p.pharmacist_id)
            result_staff = await session.exec(query_staff)
            staff_pharmacist = result_staff.first()
            
            if staff_pharmacist:
                p_read.pharmacist_name = f"{staff_pharmacist.first_name} {staff_pharmacist.last_name}"
            else:
                # Fallback to User username/email if profile incomplete
                pharmacist = await session.get(User, p.pharmacist_id)
                if pharmacist:
                     p_read.pharmacist_name = pharmacist.username
        
        # Branch enrichment removed as Pharmacy implies no branch link
        p_dict = p_read.dict()
        # if p.branch_id: ... removed
        
        enriched_pharmacies.append(p_dict)

    return {"success": True, "data": {"pharmacies": enriched_pharmacies}}

@router.post("/", response_model=Dict[str, Any])
async def create_pharmacy(
    pharmacy_in: PharmacyCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser),
):
    """
    Create new pharmacy.
    """
    # Check if pharmacy code exists
    query = select(Pharmacy).where(Pharmacy.pharmacy_code == pharmacy_in.pharmacy_code)
    result = await session.exec(query)
    if result.first():
        raise HTTPException(status_code=400, detail="Pharmacy code already exists")
        
    # Check if pharmacist is already assigned
    if pharmacy_in.pharmacist_id:
        # Check if user exists and is a pharmacist (role=7)
        pharmacist = await session.get(User, pharmacy_in.pharmacist_id)
        if not pharmacist:
            raise HTTPException(status_code=404, detail="Pharmacist user not found")
        if pharmacist.role_as != 5:
            raise HTTPException(status_code=400, detail="Selected user is not a pharmacist")
            
        # Check uniqueness in Pharmacy table
        query_check = select(Pharmacy).where(Pharmacy.pharmacist_id == pharmacy_in.pharmacist_id)
        result_check = await session.exec(query_check)
        if result_check.first():
             raise HTTPException(status_code=400, detail="Pharmacist is already assigned to another pharmacy")

    pharmacy = Pharmacy.from_orm(pharmacy_in)
    session.add(pharmacy)
    await session.commit()
    await session.refresh(pharmacy)
    return {"success": True, "data": pharmacy}

@router.put("/{pharmacy_id}", response_model=Dict[str, Any])
async def update_pharmacy(
    pharmacy_id: int,
    pharmacy_in: PharmacyUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser),
):
    """
    Update a pharmacy.
    """
    pharmacy = await session.get(Pharmacy, pharmacy_id)
    if not pharmacy:
        raise HTTPException(status_code=404, detail="Pharmacy not found")

    # Update fields
    pharmacy_data = pharmacy_in.dict(exclude_unset=True)
    
    # If updating pharmacist_id, check uniqueness
    if "pharmacist_id" in pharmacy_data and pharmacy_data["pharmacist_id"] != pharmacy.pharmacist_id:
        new_pharmacist_id = pharmacy_data["pharmacist_id"]
        if new_pharmacist_id:
             # Check role
            pharmacist = await session.get(User, new_pharmacist_id)
            if not pharmacist:
                raise HTTPException(status_code=404, detail="Pharmacist user not found")
            if pharmacist.role_as != 5:
                raise HTTPException(status_code=400, detail="Selected user is not a pharmacist")

            # Check uniqueness
            query_check = select(Pharmacy).where(Pharmacy.pharmacist_id == new_pharmacist_id)
            result_check = await session.exec(query_check)
            existing = result_check.first()
            if existing and existing.id != pharmacy_id:
                raise HTTPException(status_code=400, detail="Pharmacist is already assigned to another pharmacy")

    for key, value in pharmacy_data.items():
        setattr(pharmacy, key, value)

    session.add(pharmacy)
    await session.commit()
    await session.refresh(pharmacy)
    return {"success": True, "data": pharmacy}

@router.delete("/{pharmacy_id}", response_model=Dict[str, Any])
async def delete_pharmacy(
    pharmacy_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser),
):
    """
    Delete a pharmacy.
    """
    pharmacy = await session.get(Pharmacy, pharmacy_id)
    if not pharmacy:
        raise HTTPException(status_code=404, detail="Pharmacy not found")
        
    await session.delete(pharmacy)
    await session.commit()
    return {"success": True, "message": "Pharmacy deleted successfully"}

@router.get("/available-pharmacists", response_model=Dict[str, Any])
async def get_available_pharmacists(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser),
):
    """
    Get list of pharmacists (role=5) who are NOT assigned to any pharmacy.
    """
    try:
        from app.models.staff_pharmacist import Pharmacist as StaffPharmacist
        
        # 1. Get all assigned pharmacist IDs from Pharmacy table
        query_pharmacies = select(Pharmacy.pharmacist_id).where(Pharmacy.pharmacist_id != None)
        result_pharmacies = await session.exec(query_pharmacies)
        assigned_ids = set()
        for row in result_pharmacies.all():
            if row:
                assigned_ids.add(str(row))
        
        # 2. Get all pharmacists (User + Pharmacist profile)
        # We need to join User and Pharmacist tables to get the name
        query = select(User, StaffPharmacist).join(StaffPharmacist, User.id == StaffPharmacist.user_id).where(User.role_as == 5)
        result = await session.exec(query)
        pharmacists_data = result.all()
        
        # 3. Filter and Format
        available = []
        for user, pharmacist_profile in pharmacists_data:
            if str(user.id) not in assigned_ids:
                name = f"{pharmacist_profile.first_name} {pharmacist_profile.last_name}"
                available.append({"id": user.id, "name": name})
        
        return {"success": True, "data": available}
    except Exception as e:
        import traceback
        logger.error(f"Error in available-pharmacists: {str(e)}\n{traceback.format_exc()}")
        traceback.print_exc()
        print(f"Error in available-pharmacists: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- NEW ENDPOINTS TO FIX 404s ---

@router.get("/products", response_model=Dict[str, Any])
async def read_products(
    branch_id: Optional[str] = None,
    current_user: User = Depends(get_current_active_superuser),
):
    """
    Get products (Mocked for now as Product model not found).
    """
    return {
        "status": 200,
        "products": [] # Return empty list for now
    }

@router.get("/products-branch", response_model=Dict[str, Any])
async def read_products_branch(
    branch_id: str,
    current_user: User = Depends(get_current_active_superuser),
):
    """
    Get products for a specific branch (Mocked).
    """
    return {
        "status": 200,
        "products": []
    }

@router.get("/suppliers", response_model=Dict[str, Any])
async def read_suppliers(
    current_user: User = Depends(get_current_active_superuser),
):
    """
    Get suppliers (Mocked for now).
    """
    return {
        "status": 200,
        "suppliers": []
    }

@router.get("/{pharmacy_id}/inventory", response_model=Dict[str, Any])
async def read_inventory(
    pharmacy_id: int,
    current_user: User = Depends(get_current_active_superuser),
):
    """
    Get inventory for a pharmacy (Mocked).
    """
    return {
        "success": True,
        "data": []
    }

@router.get("/available/for-assignment", response_model=Dict[str, Any])
async def get_available_pharmacies_for_assignment(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser),
):
    """
    Get pharmacies that are NOT assigned to any branch.
    """
    query = select(Pharmacy).where(Pharmacy.branch_id == None)
    result = await session.exec(query)
    pharmacies = result.all()
    
    return {"success": True, "data": pharmacies}
