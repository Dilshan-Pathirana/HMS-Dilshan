"""Legacy Pharmacy POS endpoints.

The POS frontend contains older API calls under `/api/v1/api/*` such as:
  - api/get-products
  - api/get-purchasing-products
  - api/get-damaged-product
  - api/get-transfer-product
  - api/get-product-renewed-stock
  - api/get-product-discount

The newer backend uses `/api/v1/pharmacy-inventory/*` models.

To avoid widespread frontend rewrites, this router provides compatibility
responses with the shapes the POS UI expects.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query
from sqlmodel import func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_session
from app.models.pharmacy_inventory import (
    DailyPurchaseProduct,
    PharmacyStockTransaction,
    Product,
    ProductStock,
)
from app.models.user import User


router = APIRouter()


async def _legacy_products(session: AsyncSession) -> List[Dict[str, Any]]:
    # Load products
    prod_res = await session.exec(select(Product).where(Product.is_active == True))  # noqa
    products = list(prod_res.all())
    if not products:
        return []

    # Stock totals
    stock_res = await session.exec(
        select(ProductStock.product_id, func.coalesce(func.sum(ProductStock.quantity), 0))
        .group_by(ProductStock.product_id)
    )
    stock_by_product: Dict[str, int] = {str(r[0]): int(r[1] or 0) for r in stock_res.all()}

    # Selling price (best-effort average)
    price_res = await session.exec(
        select(ProductStock.product_id, func.coalesce(func.avg(ProductStock.selling_price), 0))
        .group_by(ProductStock.product_id)
    )
    price_by_product: Dict[str, float] = {str(r[0]): float(r[1] or 0) for r in price_res.all()}

    out: List[Dict[str, Any]] = []
    for p in products:
        out.append(
            {
                "id": p.id,
                "item_code": (p.id or "")[:8],
                "barcode": "",
                "item_name": p.name,
                "generic_name": p.generic_name or "",
                "brand_name": "",
                "category": p.category or "",
                "supplier_id": p.supplier_id or "",
                "warranty_serial": "",
                "warranty_duration": "",
                "warranty_start_date": "",
                "warranty_end_date": "",
                "warranty_type": "",
                "date_of_entry": str(getattr(p, "created_at", "")) if getattr(p, "created_at", None) else "",
                "stock_status": "",
                "stock_update_date": "",
                "unit": p.unit or "",
                "current_stock": stock_by_product.get(p.id, 0),
                "min_stock": 0,
                "reorder_level": 0,
                "reorder_quantity": 0,
                "damaged_unit": 0,
                "unit_cost": 0,
                "unit_selling_price": price_by_product.get(p.id, 0.0),
                "expiry_date": "",
                "product_store_location": "",
                "discount_type": "",
                "discount_percentage": 0,
                "discount_amount": 0,
            }
        )
    return out


def _parse_ymd(value: Optional[str]) -> Optional[date]:
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except Exception:
        return None


@router.get("/get-products")
@router.get("/cashier-user-get-products")
@router.get("/pharmacist-user-get-products")
async def legacy_get_products(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    products = await _legacy_products(session)
    return {"status": 200, "products": products}


@router.get("/get-purchasing-products")
@router.get("/cashier-get-purchasing-products")
@router.get("/pharmacist-user-get-purchasing-products")
async def legacy_get_purchasing_products(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    # Return grouped purchases in legacy shape.
    res = await session.exec(select(DailyPurchaseProduct).order_by(DailyPurchaseProduct.purchase_date.desc()))
    rows = list(res.all())

    # Preload products for name/generic/category
    product_ids = list({r.product_id for r in rows})
    prod_by_id: Dict[str, Product] = {}
    if product_ids:
        prod_res = await session.exec(select(Product).where(Product.id.in_(product_ids)))
        prod_by_id = {p.id: p for p in prod_res.all()}

    grouped: Dict[str, Dict[str, Any]] = {}
    for r in rows:
        invoice = r.invoice_no or r.id
        g = grouped.get(invoice)
        if not g:
            g = {
                "bill_id": invoice,
                "user_id": "",
                "invoice_id": invoice,
                "discount_amount": "0",
                "total_amount": "0",
                "net_total": 0,
                "amount_received": "0",
                "remain_amount": "0",
                "products": [],
            }
            grouped[invoice] = g

        p = prod_by_id.get(r.product_id)
        g["products"].append(
            {
                "purchase_product_id": r.id,
                "qty": r.quantity,
                "price": str(r.unit_price),
                "item_code": (r.product_id or "")[:8],
                "item_name": (p.name if p else ""),
                "generic_name": (p.generic_name if p else "") or "",
                "brand_name": "",
                "category": (p.category if p else "") or "",
            }
        )
        g_total = float(g["net_total"] or 0) + float(r.total or 0)
        g["net_total"] = g_total
        g["total_amount"] = str(g_total)

    return {"status": 200, "purchasing": list(grouped.values())}


@router.get("/fetch-purchasing-details")
@router.get("/cashier-fetch-purchasing-details")
@router.get("/pharmacist-user-fetch-purchasing-details")
async def legacy_fetch_purchasing_details(
    month: Optional[str] = None,
    year: Optional[str] = None,
    date_str: Optional[str] = Query(default=None, alias="date"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    q = select(DailyPurchaseProduct)

    # Filter precedence: date > month/year > year
    target_date = _parse_ymd(date_str)
    if target_date:
        q = q.where(DailyPurchaseProduct.purchase_date == target_date)
    else:
        if year:
            try:
                y = int(year)
                q = q.where(func.year(DailyPurchaseProduct.purchase_date) == y)
            except Exception:
                pass
        if month:
            try:
                m = int(month)
                q = q.where(func.month(DailyPurchaseProduct.purchase_date) == m)
            except Exception:
                pass

    q = q.order_by(DailyPurchaseProduct.purchase_date.desc())
    res = await session.exec(q)
    rows = list(res.all())

    # Reuse the same grouping logic as /get-purchasing-products
    product_ids = list({r.product_id for r in rows})
    prod_by_id: Dict[str, Product] = {}
    if product_ids:
        prod_res = await session.exec(select(Product).where(Product.id.in_(product_ids)))
        prod_by_id = {p.id: p for p in prod_res.all()}

    grouped: Dict[str, Dict[str, Any]] = {}
    for r in rows:
        invoice = r.invoice_no or r.id
        g = grouped.get(invoice)
        if not g:
            g = {
                "bill_id": invoice,
                "user_id": "",
                "invoice_id": invoice,
                "discount_amount": "0",
                "total_amount": "0",
                "net_total": 0,
                "amount_received": "0",
                "remain_amount": "0",
                "products": [],
            }
            grouped[invoice] = g

        p = prod_by_id.get(r.product_id)
        g["products"].append(
            {
                "purchase_product_id": r.id,
                "qty": r.quantity,
                "price": str(r.unit_price),
                "item_code": (r.product_id or "")[:8],
                "item_name": (p.name if p else ""),
                "generic_name": (p.generic_name if p else "") or "",
                "brand_name": "",
                "category": (p.category if p else "") or "",
            }
        )
        g_total = float(g["net_total"] or 0) + float(r.total or 0)
        g["net_total"] = g_total
        g["total_amount"] = str(g_total)

    return {"purchasing": list(grouped.values())}


async def _legacy_stock_event_list(
    session: AsyncSession,
    tx_type: str,
) -> List[Dict[str, Any]]:
    tx_res = await session.exec(
        select(PharmacyStockTransaction)
        .where(PharmacyStockTransaction.transaction_type == tx_type)
        .order_by(PharmacyStockTransaction.created_at.desc())
    )
    txs = list(tx_res.all())
    if not txs:
        return []

    product_ids = list({t.product_id for t in txs})
    prod_by_id: Dict[str, Product] = {}
    if product_ids:
        prod_res = await session.exec(select(Product).where(Product.id.in_(product_ids)))
        prod_by_id = {p.id: p for p in prod_res.all()}

    # Current stock totals
    stock_res = await session.exec(
        select(ProductStock.product_id, func.coalesce(func.sum(ProductStock.quantity), 0))
        .group_by(ProductStock.product_id)
    )
    stock_by_product: Dict[str, int] = {str(r[0]): int(r[1] or 0) for r in stock_res.all()}

    event_type_map = {"damage": 2, "transfer": 3, "return": 4, "purchase": 1, "dispense": 5}
    out: List[Dict[str, Any]] = []
    for idx, t in enumerate(txs, start=1):
        p = prod_by_id.get(t.product_id)
        current_stock = stock_by_product.get(t.product_id, 0)
        out.append(
            {
                "current_stock": current_stock,
                "event_reason": t.notes or tx_type,
                "event_type": event_type_map.get(tx_type, 0),
                "id": idx,
                "previous_stock": current_stock,
                "product_id": t.product_id,
                "stock_related_to_event": t.quantity,
                "user_id": 0,
                "item_code": (t.product_id or "")[:8],
                "item_name": (p.name if p else ""),
            }
        )
    return out


@router.get("/get-damaged-product")
@router.get("/cashier-get-damaged-product")
@router.get("/pharmacist-get-damaged-product")
async def legacy_get_damaged_products(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    events = await _legacy_stock_event_list(session, "damage")
    return {"status": 200, "product_stock_event": events}


@router.get("/get-transfer-product")
@router.get("/cashier-get-transfer-product")
@router.get("/pharmacist-get-transfer-product")
async def legacy_get_transfer_products(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    events = await _legacy_stock_event_list(session, "transfer")
    return {"status": 200, "product_stock_event": events}


@router.get("/get-product-renewed-stock")
@router.get("/cashier-get-product-renewed-stock")
@router.get("/pharmacist-get-product-renewed-stock")
async def legacy_get_renewed_stock(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    # Best-effort mapping: use `return` transactions as renewed/restocked.
    events = await _legacy_stock_event_list(session, "return")
    return {"status": 200, "product_stock_event": events}


@router.get("/get-product-discount")
@router.get("/cashier-user-get-product-discount")
@router.get("/pharmacist-user-get-product-discount")
async def legacy_get_product_discounts(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    # Discounts are not implemented in the current backend; return empty list.
    return {"status": 200, "products_discounts": []}


@router.delete("/delete-product-discount/{discount_id}")
async def legacy_delete_product_discount(
    discount_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    # Compatibility stub.
    return {"status": 200, "message": "Deleted"}
