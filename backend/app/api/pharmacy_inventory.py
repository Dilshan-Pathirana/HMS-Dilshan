"""Pharmacy & Inventory router – Patch 3.2

Products, Suppliers, Stock, Batches, Dispensing, Purchasing, Dashboard.
~40 endpoints.
"""
from __future__ import annotations

from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.api.deps import get_current_user
from app.models.pharmacy_inventory import (
    Product, ProductCreate, ProductRead,
    Supplier, SupplierCreate, SupplierRead,
    ProductStock, ProductStockRead,
    InventoryBatch, InventoryBatchRead,
    PharmacyStockTransaction, PharmacyStockTransactionRead,
    DailyPurchaseProduct, DailyPurchaseProductCreate, DailyPurchaseProductRead,
    Prescription, PrescriptionCreate, PrescriptionRead,
)
from app.services.pharmacy_service import PharmacyService

router = APIRouter()
svc = PharmacyService

# ──────────────────── Products ────────────────────

@router.get("/products", response_model=List[ProductRead])
async def list_products(
    search: Optional[str] = None,
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    return await svc.list_products(session, search, category, skip, limit)


@router.post("/products", response_model=ProductRead, status_code=201)
async def create_product(
    body: ProductCreate,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    return await svc.create_product(session, body.model_dump())


@router.get("/products/{product_id}", response_model=ProductRead)
async def get_product(
    product_id: str,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    return await svc.get_product(session, product_id)


@router.put("/products/{product_id}", response_model=ProductRead)
async def update_product(
    product_id: str,
    body: ProductCreate,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    return await svc.update_product(session, product_id, body.model_dump(exclude_unset=True))


@router.delete("/products/{product_id}")
async def delete_product(
    product_id: str,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    await svc.delete_product(session, product_id)
    return {"detail": "Product deactivated"}


@router.get("/products/categories/list")
async def list_categories(
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    from sqlmodel import select, distinct
    result = await session.exec(select(distinct(Product.category)).where(Product.category != None))  # noqa
    return [c for c in result.all() if c]


# ──────────────────── Suppliers ────────────────────

@router.get("/suppliers", response_model=List[SupplierRead])
async def list_suppliers(
    skip: int = 0, limit: int = 50,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    return await svc.list_suppliers(session, skip, limit)


@router.post("/suppliers", response_model=SupplierRead, status_code=201)
async def create_supplier(
    body: SupplierCreate,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    return await svc.create_supplier(session, body.model_dump())


@router.get("/suppliers/{supplier_id}", response_model=SupplierRead)
async def get_supplier(
    supplier_id: str,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    return await svc.get_supplier(session, supplier_id)


@router.put("/suppliers/{supplier_id}", response_model=SupplierRead)
async def update_supplier(
    supplier_id: str,
    body: SupplierCreate,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    return await svc.update_supplier(session, supplier_id, body.model_dump(exclude_unset=True))


@router.delete("/suppliers/{supplier_id}")
async def delete_supplier(
    supplier_id: str,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    await svc.delete_supplier(session, supplier_id)
    return {"detail": "Supplier deactivated"}


@router.get("/suppliers/{supplier_id}/products", response_model=List[ProductRead])
async def supplier_products(
    supplier_id: str,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    from sqlmodel import select
    result = await session.exec(
        select(Product).where(Product.supplier_id == supplier_id, Product.is_active == True)  # noqa
    )
    return list(result.all())


# ──────────────────── Stock / Inventory ────────────────────

@router.post("/stock/receive", response_model=ProductStockRead, status_code=201)
async def receive_stock(
    product_id: str = Query(...),
    branch_id: str = Query(...),
    quantity: int = Query(..., ge=1),
    batch_number: str = Query(...),
    expiry_date: Optional[date] = None,
    purchase_price: Optional[float] = None,
    selling_price: Optional[float] = None,
    supplier_id: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    return await svc.stock_in(
        session, product_id, branch_id, quantity,
        batch_number, expiry_date, purchase_price, selling_price,
        supplier_id, user.id,
    )


@router.get("/stock/levels")
async def stock_levels(
    branch_id: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    return await svc.get_stock_level_report(session, branch_id)


@router.get("/stock/low-alerts")
async def low_stock_alerts(
    branch_id: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    items = await svc.get_low_stock_alerts(session, branch_id)
    return {"alerts": items, "count": len(items)}


@router.get("/stock/expiry-alerts")
async def expiry_alerts(
    days: int = 30,
    branch_id: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    items = await svc.get_expiry_alerts(session, days, branch_id)
    return {"alerts": items, "count": len(items)}


@router.get("/stock/batches", response_model=List[InventoryBatchRead])
async def list_batches(
    product_id: Optional[str] = None,
    skip: int = 0, limit: int = 50,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    return await svc.list_batches(session, product_id, skip, limit)


@router.get("/stock/transactions")
async def stock_transactions(
    product_id: Optional[str] = None,
    skip: int = 0, limit: int = 50,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    from sqlmodel import select
    q = select(PharmacyStockTransaction)
    if product_id:
        q = q.where(PharmacyStockTransaction.product_id == product_id)
    q = q.order_by(PharmacyStockTransaction.created_at.desc()).offset(skip).limit(limit)  # type: ignore
    result = await session.exec(q)
    return list(result.all())


# ──────────────────── Dispensing ────────────────────

@router.get("/prescriptions/pending", response_model=List[PrescriptionRead])
async def pending_prescriptions(
    skip: int = 0, limit: int = 50,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    return await svc.pending_prescriptions(session, skip, limit)


@router.post("/prescriptions/{prescription_id}/dispense", response_model=PrescriptionRead)
async def dispense_prescription(
    prescription_id: str,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    return await svc.dispense(session, prescription_id, user.id)


@router.get("/prescriptions/history", response_model=List[PrescriptionRead])
async def dispense_history(
    skip: int = 0, limit: int = 50,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    return await svc.dispense_history(session, skip, limit)


@router.get("/prescriptions/{prescription_id}", response_model=PrescriptionRead)
async def get_prescription(
    prescription_id: str,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    rx = await session.get(Prescription, prescription_id)
    if not rx:
        raise HTTPException(404, "Prescription not found")
    return rx


# ──────────────────── Purchasing ────────────────────

@router.post("/purchases", response_model=DailyPurchaseProductRead, status_code=201)
async def create_purchase(
    body: DailyPurchaseProductCreate,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    data = body.model_dump()
    data["created_by"] = user.id
    return await svc.create_purchase(session, data)


@router.get("/purchases", response_model=List[DailyPurchaseProductRead])
async def list_purchases(
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    skip: int = 0, limit: int = 50,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    return await svc.list_purchases(session, from_date, to_date, skip, limit)


@router.get("/purchases/{purchase_id}", response_model=DailyPurchaseProductRead)
async def get_purchase(
    purchase_id: str,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    p = await session.get(DailyPurchaseProduct, purchase_id)
    if not p:
        raise HTTPException(404, "Purchase not found")
    return p


@router.put("/purchases/{purchase_id}", response_model=DailyPurchaseProductRead)
async def update_purchase(
    purchase_id: str,
    body: DailyPurchaseProductCreate,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    p = await session.get(DailyPurchaseProduct, purchase_id)
    if not p:
        raise HTTPException(404, "Purchase not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        if hasattr(p, k):
            setattr(p, k, v)
    session.add(p)
    await session.commit()
    await session.refresh(p)
    return p


@router.delete("/purchases/{purchase_id}")
async def delete_purchase(
    purchase_id: str,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    p = await session.get(DailyPurchaseProduct, purchase_id)
    if not p:
        raise HTTPException(404, "Purchase not found")
    await session.delete(p)
    await session.commit()
    return {"detail": "Purchase deleted"}


# ──────────────────── Dashboard ────────────────────

@router.get("/dashboard/stats")
async def pharmacy_dashboard(
    branch_id: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    return await svc.dashboard_stats(session, branch_id)


@router.get("/dashboard/recent-transactions")
async def recent_transactions(
    limit: int = 10,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    from sqlmodel import select
    result = await session.exec(
        select(PharmacyStockTransaction)
        .order_by(PharmacyStockTransaction.created_at.desc())  # type: ignore
        .limit(limit)
    )
    return list(result.all())


@router.get("/dashboard/expiring-soon")
async def expiring_soon(
    days: int = 7,
    branch_id: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    return await svc.get_expiry_alerts(session, days, branch_id)
