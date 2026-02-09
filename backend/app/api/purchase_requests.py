"""Purchase Request endpoints — Patch 5.1"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import Optional

from app.core.database import get_session
from app.api.deps import get_current_user
from app.models.user import User
from app.models.purchase_request import (
    PurchaseRequest, PurchaseRequestRead,
    PurchaseRequestItem, PurchaseRequestItemRead,
)
from app.services.purchase_request_service import PurchaseRequestService

router = APIRouter()
svc = PurchaseRequestService


# ---------- CRUD ----------

@router.post("/purchase-requests", response_model=PurchaseRequestRead)
async def create_purchase_request(
    payload: dict,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Create a new purchase request with items."""
    pr = await svc.create_request(
        session,
        branch_id=payload.get("branch_id", current_user.branch_id or ""),
        requested_by=current_user.id,
        supplier_id=payload.get("supplier_id"),
        notes=payload.get("notes"),
        items=payload.get("items", []),
    )
    return pr


@router.get("/purchase-requests", response_model=list[PurchaseRequestRead])
async def list_purchase_requests(
    branch_id: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """List purchase requests, optionally filtered."""
    req_by = None
    # Non-admin users see only their own
    if current_user.role_as not in (1, 2):  # not super-admin or branch-admin
        req_by = current_user.id
    return await svc.list_requests(session, branch_id=branch_id, status=status, requested_by=req_by, skip=skip, limit=limit)


@router.get("/purchase-requests/{request_id}", response_model=PurchaseRequestRead)
async def get_purchase_request(
    request_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    pr = await svc.get_request(session, request_id)
    if not pr:
        raise HTTPException(status_code=404, detail="Purchase request not found")
    return pr


@router.get("/purchase-requests/{request_id}/items", response_model=list[PurchaseRequestItemRead])
async def get_purchase_request_items(
    request_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await svc.get_items(session, request_id)


@router.put("/purchase-requests/{request_id}/items")
async def update_purchase_request_items(
    request_id: str,
    payload: dict,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Replace items on a draft/clarification-needed request."""
    try:
        pr = await svc.update_items(session, request_id, payload.get("items", []))
        return {"message": "Items updated", "total_amount": pr.total_amount}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ---------- WORKFLOW ----------

@router.post("/purchase-requests/{request_id}/submit", response_model=PurchaseRequestRead)
async def submit_purchase_request(
    request_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    try:
        return await svc.submit_request(session, request_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/purchase-requests/{request_id}/approve", response_model=PurchaseRequestRead)
async def approve_purchase_request(
    request_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role_as not in (1, 2):
        raise HTTPException(status_code=403, detail="Only admins can approve")
    try:
        return await svc.approve_request(session, request_id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/purchase-requests/{request_id}/reject", response_model=PurchaseRequestRead)
async def reject_purchase_request(
    request_id: str,
    payload: dict = {},
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role_as not in (1, 2):
        raise HTTPException(status_code=403, detail="Only admins can reject")
    try:
        return await svc.reject_request(session, request_id, current_user.id, payload.get("notes"))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/purchase-requests/{request_id}/clarify", response_model=PurchaseRequestRead)
async def request_clarification(
    request_id: str,
    payload: dict,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role_as not in (1, 2):
        raise HTTPException(status_code=403, detail="Only admins can request clarification")
    try:
        return await svc.clarify_request(session, request_id, current_user.id, payload.get("notes", ""))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/purchase-requests/{request_id}/fulfill", response_model=PurchaseRequestRead)
async def fulfill_purchase_request(
    request_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role_as not in (1, 2):
        raise HTTPException(status_code=403, detail="Only admins can mark fulfilled")
    try:
        return await svc.fulfill_request(session, request_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ---------- SEARCH PRODUCTS (for item picker) ----------

@router.get("/purchase-requests/search/products")
async def search_products_for_request(
    q: str = Query("", min_length=1),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Search products to add to a purchase request."""
    from sqlmodel import select, col
    from app.models.pharmacy_inventory import Product
    query = select(Product).where(
        col(Product.name).ilike(f"%{q}%")
    ).limit(20)
    result = await session.exec(query)
    products = result.all()
    return [{"id": p.id, "name": p.name, "unit_price": getattr(p, "selling_price", 0)} for p in products]
