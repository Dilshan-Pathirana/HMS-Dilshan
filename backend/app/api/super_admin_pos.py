"""Super Admin POS endpoints.

This router exists primarily to support the frontend POS Super Admin pages which
expect URLs under `/api/v1/super-admin/pos/*`.

It provides lightweight, DB-backed responses (or safe empty defaults) rather
than 404s, so the UI can show "no data" notifications instead of failing.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query
from sqlmodel import func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_session
from app.models.branch import Branch
from app.models.pharmacy_inventory import Product, ProductStock
from app.models.pos import BillingTransaction, TransactionItem
from app.models.user import User


router = APIRouter()


def _date_range_from_param(range_value: str) -> tuple[date, date]:
    today = date.today()
    if range_value == "7days":
        return today - timedelta(days=6), today
    if range_value == "30days":
        return today - timedelta(days=29), today
    if range_value == "thisMonth":
        start = today.replace(day=1)
        return start, today
    if range_value == "3months":
        return today - timedelta(days=89), today
    return today - timedelta(days=6), today


async def _list_branches(session: AsyncSession) -> List[Dict[str, Any]]:
    res = await session.exec(select(Branch).order_by(Branch.center_name))
    branches = list(res.all())
    return [
        {
            "id": b.id,
            # Frontend sometimes expects both `name` and `center_name`.
            "name": b.center_name,
            "center_name": b.center_name,
            "city": "",
            "address": "",
            "phone": "",
        }
        for b in branches
    ]


@router.get("/branches")
async def list_pos_branches(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    branches = await _list_branches(session)
    return {"branches": branches}


@router.get("/inventory-list")
async def super_admin_pos_inventory_list(
    branch_id: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    # Return an array (not wrapped) because the frontend sets state directly from `response.data`.
    prod_res = await session.exec(select(Product).where(Product.is_active == True))  # noqa
    products = list(prod_res.all())
    if not products:
        return []

    product_ids = [p.id for p in products]
    stock_q = select(ProductStock).where(ProductStock.product_id.in_(product_ids))
    if branch_id:
        stock_q = stock_q.where(ProductStock.branch_id == branch_id)
    stock_res = await session.exec(stock_q)
    stocks = list(stock_res.all())

    # Group stock rows by product
    stocks_by_product: Dict[str, List[ProductStock]] = {}
    for s in stocks:
        stocks_by_product.setdefault(s.product_id, []).append(s)

    out: List[Dict[str, Any]] = []
    for p in products:
        rows = stocks_by_product.get(p.id, [])
        total_stock = sum(int(r.quantity or 0) for r in rows)

        # Pick a representative batch row for price/batch display.
        chosen: Optional[ProductStock] = None
        in_stock_rows = [r for r in rows if int(r.quantity or 0) > 0]
        if in_stock_rows:
            # Prefer the earliest expiry among in-stock batches.
            with_expiry = [r for r in in_stock_rows if r.expiry_date is not None]
            if with_expiry:
                chosen = sorted(with_expiry, key=lambda r: r.expiry_date)[0]
            else:
                chosen = in_stock_rows[0]
        elif rows:
            chosen = rows[0]

        selling_price = float(chosen.selling_price) if (chosen and chosen.selling_price is not None) else 0.0

        out.append(
            {
                "id": p.id,
                "item_name": p.name,
                "item_code": (p.id or "")[:8],
                "selling_price": selling_price,
                "stock": int(total_stock),
                "category": p.category or "",
                "batch_price": float(chosen.purchase_price) if (chosen and chosen.purchase_price is not None) else None,
                "batch_id": chosen.id if chosen else None,
                "batch_number": chosen.batch_number if chosen else None,
                "expiry_date": str(chosen.expiry_date) if (chosen and chosen.expiry_date is not None) else None,
            }
        )

    return out


@router.get("/dashboard-stats")
async def super_admin_pos_dashboard_stats(
    branch_id: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    # Branch lists for dropdown
    all_branches = await _list_branches(session)
    selected_branch = next((b for b in all_branches if b["id"] == branch_id), None) if branch_id else None

    # Today + yesterday sales
    today = date.today()
    yesterday = today - timedelta(days=1)

    base_filters = [BillingTransaction.status == "completed"]
    if branch_id:
        base_filters.append(BillingTransaction.branch_id == branch_id)

    today_filters = base_filters + [func.date(BillingTransaction.created_at) == today]
    yesterday_filters = base_filters + [func.date(BillingTransaction.created_at) == yesterday]

    today_sales_res = await session.exec(
        select(func.coalesce(func.sum(BillingTransaction.net_amount), 0)).where(*today_filters)
    )
    today_txn_res = await session.exec(
        select(func.count(BillingTransaction.id)).where(*today_filters)
    )
    yesterday_sales_res = await session.exec(
        select(func.coalesce(func.sum(BillingTransaction.net_amount), 0)).where(*yesterday_filters)
    )

    today_sales = float(today_sales_res.one() or 0)
    today_txns = int(today_txn_res.one() or 0)
    yesterday_sales = float(yesterday_sales_res.one() or 0)
    sales_change_pct = (
        ((today_sales - yesterday_sales) / yesterday_sales * 100)
        if yesterday_sales
        else (100.0 if today_sales else 0.0)
    )

    # Payment breakdown (map backend values -> frontend buckets)
    payment_rows = await session.exec(
        select(BillingTransaction.payment_method, func.coalesce(func.sum(BillingTransaction.net_amount), 0))
        .where(*today_filters)
        .group_by(BillingTransaction.payment_method)
    )
    payment_breakdown = {"cash": 0.0, "card": 0.0, "online": 0.0, "qr": 0.0}
    for method, amount in payment_rows.all():
        m = (method or "").lower()
        a = float(amount or 0)
        if "cash" in m:
            payment_breakdown["cash"] += a
        elif "card" in m:
            payment_breakdown["card"] += a
        elif "qr" in m:
            payment_breakdown["qr"] += a
        else:
            payment_breakdown["online"] += a

    # Branch performance (today)
    perf_filters = [BillingTransaction.status == "completed", func.date(BillingTransaction.created_at) == today]
    perf_rows = await session.exec(
        select(
            BillingTransaction.branch_id,
            func.coalesce(func.sum(BillingTransaction.net_amount), 0).label("sales"),
            func.count(BillingTransaction.id).label("count"),
        )
        .where(*perf_filters)
        .group_by(BillingTransaction.branch_id)
    )
    perf_by_branch = {
        str(r[0]): {"total_sales": float(r[1] or 0), "transaction_count": int(r[2] or 0)}
        for r in perf_rows.all()
    }
    branch_performance = []
    for b in all_branches:
        m = perf_by_branch.get(b["id"], {"total_sales": 0.0, "transaction_count": 0})
        branch_performance.append(
            {
                "id": b["id"],
                "name": b["name"],
                "type": "branch",
                "total_sales": m["total_sales"],
                "transaction_count": m["transaction_count"],
            }
        )

    payload = {
        "selected_branch": selected_branch,
        "all_branches": all_branches,
        "today_stats": {
            "date": str(today),
            "total_sales": today_sales,
            "transaction_count": today_txns,
            "cash_in": payment_breakdown["cash"],
            "cash_out": 0.0,
            "net_cash": payment_breakdown["cash"],
        },
        "payment_breakdown": payment_breakdown,
        "branch_performance": branch_performance,
        "comparison": {
            "yesterday_sales": yesterday_sales,
            "sales_change_percentage": sales_change_pct,
        },
    }

    return {"status": 200, "data": payload}


@router.get("/cashiers")
async def super_admin_pos_cashiers(
    branch_id: Optional[str] = None,
    date_str: Optional[str] = Query(default=None, alias="date"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    # Cashier role_as is 6 in backend mapping.
    cashier_role = 6
    q = select(User).where(User.role_as == cashier_role)
    if branch_id:
        q = q.where(User.branch_id == branch_id)
    res = await session.exec(q)
    users = list(res.all())

    # Parse date; default today
    target_date = date.today()
    if date_str:
        try:
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except Exception:
            target_date = date.today()

    week_start = target_date - timedelta(days=6)

    # Precompute branch names
    branches = await _list_branches(session)
    branch_name_by_id = {b["id"]: b["name"] for b in branches}

    cashiers: List[Dict[str, Any]] = []
    for u in users:
        today_filters = [
            BillingTransaction.status == "completed",
            BillingTransaction.cashier_id == u.id,
            func.date(BillingTransaction.created_at) == target_date,
        ]
        if branch_id:
            today_filters.append(BillingTransaction.branch_id == branch_id)

        week_filters = [
            BillingTransaction.status == "completed",
            BillingTransaction.cashier_id == u.id,
            func.date(BillingTransaction.created_at) >= week_start,
            func.date(BillingTransaction.created_at) <= target_date,
        ]
        if branch_id:
            week_filters.append(BillingTransaction.branch_id == branch_id)

        today_count_res = await session.exec(select(func.count(BillingTransaction.id)).where(*today_filters))
        today_sum_res = await session.exec(
            select(func.coalesce(func.sum(BillingTransaction.net_amount), 0)).where(*today_filters)
        )
        week_count_res = await session.exec(select(func.count(BillingTransaction.id)).where(*week_filters))
        week_sum_res = await session.exec(
            select(func.coalesce(func.sum(BillingTransaction.net_amount), 0)).where(*week_filters)
        )

        full_name = (f"{u.first_name or ''} {u.last_name or ''}").strip() or (u.username or u.email)
        cashiers.append(
            {
                "id": u.id,
                "name": full_name,
                "email": u.email,
                "branch_id": u.branch_id or "",
                "branch_name": branch_name_by_id.get(u.branch_id or "", ""),
                "is_active": bool(u.is_active),
                "created_at": getattr(u, "created_at", None) and str(getattr(u, "created_at")),
                "today_transactions": int(today_count_res.one() or 0),
                "today_total": float(today_sum_res.one() or 0),
                "week_transactions": int(week_count_res.one() or 0),
                "week_total": float(week_sum_res.one() or 0),
                "eod_completed": False,
                "last_eod_date": None,
            }
        )

    return {"cashiers": cashiers}


@router.get("/analytics")
async def super_admin_pos_analytics(
    range: str = Query(default="7days"),
    branch_id: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    start_date, end_date = _date_range_from_param(range)

    branches = await _list_branches(session)
    branch_name_by_id = {b["id"]: b["name"] for b in branches}

    filters = [
        BillingTransaction.status == "completed",
        func.date(BillingTransaction.created_at) >= start_date,
        func.date(BillingTransaction.created_at) <= end_date,
    ]
    if branch_id:
        filters.append(BillingTransaction.branch_id == branch_id)

    total_sales_res = await session.exec(
        select(func.coalesce(func.sum(BillingTransaction.net_amount), 0)).where(*filters)
    )
    total_txn_res = await session.exec(select(func.count(BillingTransaction.id)).where(*filters))
    total_sales = float(total_sales_res.one() or 0)
    total_txns = int(total_txn_res.one() or 0)

    daily_rows = await session.exec(
        select(
            func.date(BillingTransaction.created_at).label("day"),
            func.coalesce(func.sum(BillingTransaction.net_amount), 0).label("sales"),
            func.count(BillingTransaction.id).label("count"),
        )
        .where(*filters)
        .group_by(func.date(BillingTransaction.created_at))
        .order_by(func.date(BillingTransaction.created_at))
    )
    daily_sales = [
        {"date": str(r[0]), "sales": float(r[1] or 0), "transactions": int(r[2] or 0)}
        for r in daily_rows.all()
    ]

    pay_rows = await session.exec(
        select(BillingTransaction.payment_method, func.coalesce(func.sum(BillingTransaction.net_amount), 0))
        .where(*filters)
        .group_by(BillingTransaction.payment_method)
    )
    payment_trends = {"cash": 0.0, "card": 0.0, "online": 0.0, "qr": 0.0}
    for method, amount in pay_rows.all():
        m = (method or "").lower()
        a = float(amount or 0)
        if "cash" in m:
            payment_trends["cash"] += a
        elif "card" in m:
            payment_trends["card"] += a
        elif "qr" in m:
            payment_trends["qr"] += a
        else:
            payment_trends["online"] += a

    bc_rows = await session.exec(
        select(
            BillingTransaction.branch_id,
            func.coalesce(func.sum(BillingTransaction.net_amount), 0),
            func.count(BillingTransaction.id),
        )
        .where(*filters)
        .group_by(BillingTransaction.branch_id)
    )
    branch_comparison = [
        {
            "id": str(r[0]),
            "name": branch_name_by_id.get(str(r[0]), ""),
            "total_sales": float(r[1] or 0),
            "transaction_count": int(r[2] or 0),
        }
        for r in bc_rows.all()
    ]

    tc_rows = await session.exec(
        select(
            BillingTransaction.cashier_id,
            func.coalesce(func.sum(BillingTransaction.net_amount), 0),
            func.count(BillingTransaction.id),
            func.min(BillingTransaction.branch_id),
        )
        .where(*filters)
        .group_by(BillingTransaction.cashier_id)
        .order_by(func.coalesce(func.sum(BillingTransaction.net_amount), 0).desc())
        .limit(10)
    )
    cashier_ids = [str(r[0]) for r in tc_rows.all()]
    users = []
    if cashier_ids:
        users = list((await session.exec(select(User).where(User.id.in_(cashier_ids)))).all())
    user_by_id = {u.id: u for u in users}
    top_cashiers = []
    for r in tc_rows.all():
        cashier_id = str(r[0])
        u = user_by_id.get(cashier_id)
        name = cashier_id
        if u:
            name = (f"{u.first_name or ''} {u.last_name or ''}").strip() or (u.username or u.email)
        top_cashiers.append(
            {
                "id": cashier_id,
                "name": name,
                "branch_name": branch_name_by_id.get(str(r[3] or ""), ""),
                "total_sales": float(r[1] or 0),
                "transaction_count": int(r[2] or 0),
            }
        )

    tp_filters = [
        BillingTransaction.status == "completed",
        func.date(BillingTransaction.created_at) >= start_date,
        func.date(BillingTransaction.created_at) <= end_date,
    ]
    if branch_id:
        tp_filters.append(BillingTransaction.branch_id == branch_id)

    tp_rows = await session.exec(
        select(
            TransactionItem.description,
            func.coalesce(func.sum(TransactionItem.quantity), 0),
            func.coalesce(func.sum(TransactionItem.total), 0),
        )
        .join(BillingTransaction, BillingTransaction.id == TransactionItem.transaction_id)
        .where(*tp_filters)
        .group_by(TransactionItem.description)
        .order_by(func.coalesce(func.sum(TransactionItem.total), 0).desc())
        .limit(10)
    )
    top_products = [
        {"name": str(r[0] or ""), "quantity": int(r[1] or 0), "revenue": float(r[2] or 0)}
        for r in tp_rows.all()
    ]

    payload = {
        "branches": [{"id": b["id"], "name": b["name"]} for b in branches],
        "selected_branch_id": branch_id or None,
        "summary": {
            "total_sales": total_sales,
            "total_transactions": total_txns,
            "average_transaction": (total_sales / total_txns) if total_txns else 0.0,
            "total_cash_in": payment_trends["cash"],
            "total_cash_out": 0.0,
        },
        "daily_sales": daily_sales,
        "payment_trends": payment_trends,
        "branch_comparison": branch_comparison,
        "top_cashiers": top_cashiers,
        "top_products": top_products,
    }

    return {"status": 200, "data": payload}


enhanced_router = APIRouter()


@enhanced_router.get("/dashboard-stats")
async def enhanced_pos_dashboard_stats_stub(
    branch_id: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    # The Zoned dashboard expects `{ success: true, data: {...} }`.
    return {
        "success": True,
        "data": {
            "pending_overrides": 0,
            "today_discount_total": 0,
            "expiring_soon_count": 0,
            "low_stock_count": 0,
            "active_discounts": 0,
            "month_profit": 0,
            "month_margin": 0,
        },
    }


@enhanced_router.get("/discounts/active-offers")
async def enhanced_pos_active_offers_stub(
    branch_id: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    # Discounts are not implemented; return a safe empty list so the UI can show a "no offers" state.
    return {"success": True, "data": []}
