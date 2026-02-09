"""Pharmacy & Inventory business logic – Patch 3.2

FIFO/FEFO stock, reorder alerts, batch tracking, dispensing.
"""
from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import List, Optional

from fastapi import HTTPException
from sqlmodel import select, func
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.pharmacy_inventory import (
    Product,
    ProductStock,
    Supplier,
    InventoryBatch,
    PharmacyStockTransaction,
    DailyPurchaseProduct,
    Prescription,
)


class PharmacyService:
    """Encapsulates product, stock, supplier, and dispensing operations."""

    # ---- Products ----

    @staticmethod
    async def create_product(session: AsyncSession, data: dict) -> Product:
        product = Product(**data)
        session.add(product)
        await session.commit()
        await session.refresh(product)
        return product

    @staticmethod
    async def list_products(session: AsyncSession, search: Optional[str] = None,
                            category: Optional[str] = None, skip: int = 0, limit: int = 50):
        q = select(Product).where(Product.is_active == True)  # noqa
        if search:
            q = q.where(Product.name.contains(search))
        if category:
            q = q.where(Product.category == category)
        q = q.offset(skip).limit(limit)
        result = await session.exec(q)
        return list(result.all())

    @staticmethod
    async def get_product(session: AsyncSession, product_id: str) -> Product:
        p = await session.get(Product, product_id)
        if not p:
            raise HTTPException(404, "Product not found")
        return p

    @staticmethod
    async def update_product(session: AsyncSession, product_id: str, data: dict) -> Product:
        p = await session.get(Product, product_id)
        if not p:
            raise HTTPException(404, "Product not found")
        for k, v in data.items():
            if hasattr(p, k):
                setattr(p, k, v)
        session.add(p)
        await session.commit()
        await session.refresh(p)
        return p

    @staticmethod
    async def delete_product(session: AsyncSession, product_id: str):
        p = await session.get(Product, product_id)
        if not p:
            raise HTTPException(404, "Product not found")
        p.is_active = False
        session.add(p)
        await session.commit()

    # ---- Suppliers ----

    @staticmethod
    async def create_supplier(session: AsyncSession, data: dict) -> Supplier:
        s = Supplier(**data)
        session.add(s)
        await session.commit()
        await session.refresh(s)
        return s

    @staticmethod
    async def list_suppliers(session: AsyncSession, skip: int = 0, limit: int = 50):
        result = await session.exec(
            select(Supplier).where(Supplier.is_active == True).offset(skip).limit(limit)  # noqa
        )
        return list(result.all())

    @staticmethod
    async def get_supplier(session: AsyncSession, supplier_id: str) -> Supplier:
        s = await session.get(Supplier, supplier_id)
        if not s:
            raise HTTPException(404, "Supplier not found")
        return s

    @staticmethod
    async def update_supplier(session: AsyncSession, supplier_id: str, data: dict) -> Supplier:
        s = await session.get(Supplier, supplier_id)
        if not s:
            raise HTTPException(404, "Supplier not found")
        for k, v in data.items():
            if hasattr(s, k):
                setattr(s, k, v)
        session.add(s)
        await session.commit()
        await session.refresh(s)
        return s

    @staticmethod
    async def delete_supplier(session: AsyncSession, supplier_id: str):
        s = await session.get(Supplier, supplier_id)
        if not s:
            raise HTTPException(404, "Supplier not found")
        s.is_active = False
        session.add(s)
        await session.commit()

    # ---- Stock operations ----

    @staticmethod
    async def stock_in(session: AsyncSession, product_id: str, branch_id: str,
                       quantity: int, batch_no: str, expiry_date: Optional[date],
                       purchase_price: Optional[float], selling_price: Optional[float],
                       supplier_id: Optional[str], performed_by: str) -> ProductStock:
        """Add stock (purchase/receive)."""
        stock = ProductStock(
            product_id=product_id, branch_id=branch_id, quantity=quantity,
            batch_number=batch_no, expiry_date=expiry_date,
            purchase_price=purchase_price, selling_price=selling_price,
        )
        session.add(stock)

        batch = InventoryBatch(
            product_id=product_id, batch_no=batch_no,
            received_date=date.today(), expiry_date=expiry_date,
            quantity_received=quantity, quantity_remaining=quantity,
            cost_price=purchase_price, supplier_id=supplier_id,
        )
        session.add(batch)

        txn = PharmacyStockTransaction(
            product_id=product_id, transaction_type="purchase",
            quantity=quantity, performed_by=performed_by,
            notes=f"Batch {batch_no}",
        )
        session.add(txn)

        await session.commit()
        await session.refresh(stock)
        return stock

    @staticmethod
    async def get_low_stock_alerts(session: AsyncSession, branch_id: Optional[str] = None):
        """Products where quantity <= reorder_level."""
        q = select(ProductStock).where(ProductStock.quantity <= ProductStock.reorder_level)
        if branch_id:
            q = q.where(ProductStock.branch_id == branch_id)
        result = await session.exec(q)
        return list(result.all())

    @staticmethod
    async def get_expiry_alerts(session: AsyncSession, days_ahead: int = 30,
                                branch_id: Optional[str] = None):
        """Products expiring within N days."""
        cutoff = date.today() + timedelta(days=days_ahead)
        q = select(ProductStock).where(
            ProductStock.expiry_date != None,  # noqa
            ProductStock.expiry_date <= cutoff,
            ProductStock.quantity > 0,
        )
        if branch_id:
            q = q.where(ProductStock.branch_id == branch_id)
        result = await session.exec(q)
        return list(result.all())

    @staticmethod
    async def get_stock_level_report(session: AsyncSession, branch_id: Optional[str] = None):
        """Total stock per product."""
        q = select(
            ProductStock.product_id,
            func.sum(ProductStock.quantity).label("total_quantity"),
        ).group_by(ProductStock.product_id)
        if branch_id:
            q = q.where(ProductStock.branch_id == branch_id)
        result = await session.exec(q)
        return [{"product_id": r[0], "total_quantity": r[1]} for r in result.all()]

    @staticmethod
    async def list_batches(session: AsyncSession, product_id: Optional[str] = None,
                           skip: int = 0, limit: int = 50):
        q = select(InventoryBatch)
        if product_id:
            q = q.where(InventoryBatch.product_id == product_id)
        q = q.order_by(InventoryBatch.received_date.desc()).offset(skip).limit(limit)  # type: ignore
        result = await session.exec(q)
        return list(result.all())

    # ---- Dispensing ----

    @staticmethod
    async def dispense(session: AsyncSession, prescription_id: str, dispensed_by: str) -> Prescription:
        rx = await session.get(Prescription, prescription_id)
        if not rx:
            raise HTTPException(404, "Prescription not found")
        if rx.status == "dispensed":
            raise HTTPException(400, "Already dispensed")
        rx.status = "dispensed"
        rx.dispensed_by = dispensed_by
        rx.dispensed_at = datetime.utcnow()
        session.add(rx)
        await session.commit()
        await session.refresh(rx)
        return rx

    @staticmethod
    async def pending_prescriptions(session: AsyncSession, skip: int = 0, limit: int = 50):
        result = await session.exec(
            select(Prescription)
            .where(Prescription.status == "pending")
            .order_by(Prescription.created_at)  # type: ignore
            .offset(skip).limit(limit)
        )
        return list(result.all())

    @staticmethod
    async def dispense_history(session: AsyncSession, skip: int = 0, limit: int = 50):
        result = await session.exec(
            select(Prescription)
            .where(Prescription.status == "dispensed")
            .order_by(Prescription.dispensed_at.desc())  # type: ignore
            .offset(skip).limit(limit)
        )
        return list(result.all())

    # ---- Purchasing ----

    @staticmethod
    async def create_purchase(session: AsyncSession, data: dict) -> DailyPurchaseProduct:
        p = DailyPurchaseProduct(**data)
        session.add(p)
        await session.commit()
        await session.refresh(p)
        return p

    @staticmethod
    async def list_purchases(session: AsyncSession, from_date: Optional[date] = None,
                             to_date: Optional[date] = None, skip: int = 0, limit: int = 50):
        q = select(DailyPurchaseProduct)
        if from_date:
            q = q.where(DailyPurchaseProduct.purchase_date >= from_date)
        if to_date:
            q = q.where(DailyPurchaseProduct.purchase_date <= to_date)
        q = q.order_by(DailyPurchaseProduct.purchase_date.desc()).offset(skip).limit(limit)  # type: ignore
        result = await session.exec(q)
        return list(result.all())

    # ---- Dashboard ----

    @staticmethod
    async def dashboard_stats(session: AsyncSession, branch_id: Optional[str] = None):
        pending = await session.exec(
            select(func.count(Prescription.id)).where(Prescription.status == "pending")
        )
        low_stock = await PharmacyService.get_low_stock_alerts(session, branch_id)
        total_products = await session.exec(
            select(func.count(Product.id)).where(Product.is_active == True)  # noqa
        )
        return {
            "pendingPrescriptions": pending.one() or 0,
            "lowStockCount": len(low_stock),
            "totalProducts": total_products.one() or 0,
        }
