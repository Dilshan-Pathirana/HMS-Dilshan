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
        if pharmacist.role_as != 7:
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
    pharmacy_id: str,
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
            if pharmacist.role_as != 7:
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
    pharmacy_id: str,
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
        query = select(User, StaffPharmacist).join(StaffPharmacist, User.id == StaffPharmacist.user_id).where(User.role_as == 7)
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
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser),
):
    """Get all products."""
    from app.models.pharmacy_inventory import Product as ProductModel
    result = await session.exec(select(ProductModel).where(ProductModel.is_active == True))  # noqa
    products = result.all()
    return {
        "status": 200,
        "products": [
            {
                "id": p.id,
                "supplier_id": p.supplier_id or "",
                "item_code": p.item_code or "",
                "barcode": p.barcode or "",
                "item_name": p.name,
                "generic_name": p.generic_name or "",
                "brand_name": p.brand_name or "",
                "category": p.category or "",
                "unit": p.unit or "pcs",
                "current_stock": p.current_stock or 0,
                "min_stock": p.min_stock or 0,
                "reorder_level": p.reorder_level or 0,
                "reorder_quantity": p.reorder_quantity or 0,
                "unit_cost": float(p.unit_cost or 0),
                "unit_selling_price": float(p.unit_selling_price or 0),
                "expiry_date": p.expiry_date or "",
                "product_store_location": p.product_store_location or "",
                "warranty_serial": p.warranty_serial or "",
                "warranty_duration": p.warranty_duration or "",
                "warranty_type": p.warranty_type or "",
                "requires_prescription": p.requires_prescription,
                "is_active": p.is_active,
                "created_at": str(p.created_at),
            }
            for p in products
        ],
    }


def _map_frontend_to_product(data: dict) -> dict:
    """Map frontend product field names to DB column names."""
    return {
        "name": data.get("item_name", ""),
        "generic_name": data.get("generic_name", ""),
        "category": data.get("category", ""),
        "unit": data.get("unit", "pcs"),
        "supplier_id": data.get("supplier_id") or None,
        "item_code": data.get("item_code", ""),
        "barcode": data.get("barcode", ""),
        "brand_name": data.get("brand_name", ""),
        "current_stock": int(data.get("current_stock", 0) or 0),
        "min_stock": int(data.get("min_stock", 0) or 0),
        "reorder_level": int(data.get("reorder_level", 0) or 0),
        "reorder_quantity": int(data.get("reorder_quantity", 0) or 0),
        "unit_cost": float(data.get("unit_cost", 0) or 0),
        "unit_selling_price": float(data.get("unit_selling_price", 0) or 0),
        "expiry_date": data.get("expiry_date", ""),
        "product_store_location": data.get("product_store_location", ""),
        "warranty_serial": data.get("warranty_serial", ""),
        "warranty_duration": data.get("warranty_duration", ""),
        "warranty_type": data.get("warranty_type", ""),
    }


@router.post("/products", response_model=Dict[str, Any])
async def create_product(
    payload: Dict[str, Any],
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser),
):
    """Create a new product and assign stock to selected pharmacies (each linked to a branch)."""
    from app.models.pharmacy_inventory import Product as ProductModel, ProductStock
    from app.models.pharmacy import Pharmacy

    target_pharmacy_ids = payload.pop("target_pharmacy_ids", [])
    # Remove legacy field if frontend still sends it
    payload.pop("target_branch_ids", None)

    mapped = _map_frontend_to_product(payload)
    if not mapped["name"]:
        raise HTTPException(status_code=400, detail="Item name is required")

    product = ProductModel(**mapped)
    session.add(product)
    await session.flush()  # get product.id

    # Create product_stock entries for each target pharmacy
    if target_pharmacy_ids:
        for pid in target_pharmacy_ids:
            pharmacy = await session.get(Pharmacy, pid)
            stock = ProductStock(
                product_id=product.id,
                branch_id=pharmacy.branch_id if pharmacy else None,
                pharmacy_id=pid,
                quantity=int(mapped.get("current_stock") or 0),
                purchase_price=float(mapped.get("unit_cost") or 0),
                selling_price=float(mapped.get("unit_selling_price") or 0),
                reorder_level=int(mapped.get("reorder_level") or 0),
                expiry_date=mapped.get("expiry_date") or None,
            )
            session.add(stock)

    await session.commit()
    await session.refresh(product)
    return {"status": 200, "message": "Product created successfully", "product_id": product.id}


@router.post("/products/{product_id}", response_model=Dict[str, Any])
async def update_product(
    product_id: str,
    payload: Dict[str, Any],
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser),
):
    """Update an existing product."""
    from app.models.pharmacy_inventory import Product as ProductModel
    product = await session.get(ProductModel, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    mapped = _map_frontend_to_product(payload)
    for key, value in mapped.items():
        setattr(product, key, value)
    session.add(product)
    await session.commit()
    await session.refresh(product)
    return {"status": 200, "message": "Product updated successfully"}


@router.delete("/products/{product_id}", response_model=Dict[str, Any])
async def delete_product(
    product_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser),
):
    """Soft-delete a product."""
    from app.models.pharmacy_inventory import Product as ProductModel
    product = await session.get(ProductModel, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.is_active = False
    session.add(product)
    await session.commit()
    return {"success": True, "status": 200, "message": "Product deleted successfully"}

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
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser),
):
    """Get all suppliers."""
    from app.models.pharmacy_inventory import Supplier as SupplierModel
    result = await session.exec(select(SupplierModel).where(SupplierModel.is_active == True))  # noqa
    suppliers = result.all()
    return {
        "status": 200,
        "suppliers": [
            {
                "id": s.id,
                "supplier_name": s.name,
                "contact_person": s.contact_person or "",
                "contact_number": s.phone or "",
                "contact_email": s.email or "",
                "supplier_address": s.address or "",
                "supplier_city": s.supplier_city or "",
                "supplier_country": s.supplier_country or "",
                "supplier_type": s.supplier_type or "",
                "products_supplied": s.products_supplied or "",
                "delivery_time": s.delivery_time or "",
                "payment_terms": s.payment_terms or "",
                "bank_details": s.bank_details or "",
                "rating": s.rating or "",
                "discounts_agreements": s.discounts_agreements or "",
                "return_policy": s.return_policy or "",
                "note": s.note or "",
                "created_at": str(s.created_at),
            }
            for s in suppliers
        ],
    }


@router.get("/{pharmacy_id}/inventory", response_model=Dict[str, Any])
async def read_inventory(
    pharmacy_id: str,
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


# ──────────────── Supplier CRUD ────────────────

def _map_frontend_to_supplier(data: dict) -> dict:
    """Map frontend field names to DB column names."""
    return {
        "name": data.get("supplier_name", ""),
        "contact_person": data.get("contact_person", ""),
        "phone": data.get("contact_number", ""),
        "email": data.get("contact_email", ""),
        "address": data.get("supplier_address", ""),
        "supplier_city": data.get("supplier_city", ""),
        "supplier_country": data.get("supplier_country", ""),
        "supplier_type": data.get("supplier_type", ""),
        "products_supplied": data.get("products_supplied", ""),
        "delivery_time": data.get("delivery_time", ""),
        "payment_terms": data.get("payment_terms", ""),
        "bank_details": data.get("bank_details", ""),
        "rating": data.get("rating", ""),
        "discounts_agreements": data.get("discounts_agreements", ""),
        "return_policy": data.get("return_policy", ""),
        "note": data.get("note", ""),
    }


@router.post("/suppliers", response_model=Dict[str, Any])
async def create_supplier(
    payload: Dict[str, Any],
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser),
):
    """Create a new supplier."""
    from app.models.pharmacy_inventory import Supplier as SupplierModel
    mapped = _map_frontend_to_supplier(payload)
    if not mapped["name"]:
        raise HTTPException(status_code=400, detail="Supplier name is required")
    supplier = SupplierModel(**mapped)
    session.add(supplier)
    await session.commit()
    await session.refresh(supplier)
    return {"status": 200, "message": "Supplier created successfully", "supplier_id": supplier.id}


@router.post("/suppliers/{supplier_id}", response_model=Dict[str, Any])
async def update_supplier(
    supplier_id: str,
    payload: Dict[str, Any],
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser),
):
    """Update an existing supplier."""
    from app.models.pharmacy_inventory import Supplier as SupplierModel
    supplier = await session.get(SupplierModel, supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    mapped = _map_frontend_to_supplier(payload)
    for key, value in mapped.items():
        setattr(supplier, key, value)
    session.add(supplier)
    await session.commit()
    await session.refresh(supplier)
    return {"status": 200, "message": "Supplier updated successfully"}


@router.delete("/suppliers/{supplier_id}", response_model=Dict[str, Any])
async def delete_supplier(
    supplier_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser),
):
    """Soft-delete a supplier (mark inactive)."""
    from app.models.pharmacy_inventory import Supplier as SupplierModel
    supplier = await session.get(SupplierModel, supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    supplier.is_active = False
    session.add(supplier)
    await session.commit()
    return {"success": True, "status": 200, "message": "Supplier deleted successfully"}
