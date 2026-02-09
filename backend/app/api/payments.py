"""PayHere Payment endpoints — Patch 5.6"""

from fastapi import APIRouter, Depends, HTTPException, Request, Form
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.api.deps import get_current_user
from app.models.user import User
from app.services.payment_service import PayHereService

router = APIRouter()


@router.post("/initiate")
async def initiate_payment(
    payload: dict,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Generate PayHere checkout form data for a payment."""
    appointment_id = payload.get("appointment_id", "")
    amount = payload.get("amount", 0)
    item_name = payload.get("item_name", "Appointment Payment")
    return_url = payload.get("return_url", "")
    cancel_url = payload.get("cancel_url", "")
    notify_url = payload.get("notify_url", "")

    if not amount or amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")

    form_data = PayHereService.build_payment_form_data(
        order_id=appointment_id or f"ORD-{current_user.id[:8]}",
        amount=float(amount),
        item_name=item_name,
        customer_name=getattr(current_user, "name", "") or current_user.email or "",
        customer_email=current_user.email or "",
        customer_phone=getattr(current_user, "contact_number_mobile", "") or "",
        return_url=return_url,
        cancel_url=cancel_url,
        notify_url=notify_url,
    )

    return {"success": True, "payment_data": form_data}


@router.post("/notify")
async def payment_notify(
    request: Request,
    session: AsyncSession = Depends(get_session),
):
    """PayHere webhook callback — verify signature and update payment status.
    This endpoint is called by PayHere's server, NOT by the client."""
    form = await request.form()
    merchant_id = form.get("merchant_id", "")
    order_id = form.get("order_id", "")
    payhere_amount = form.get("payhere_amount", "")
    payhere_currency = form.get("payhere_currency", "")
    status_code = form.get("status_code", "")
    md5sig = form.get("md5sig", "")

    # Verify signature
    is_valid = PayHereService.verify_notification(
        merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig
    )

    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid signature")

    # status_code: 2 = success, 0 = pending, -1 = canceled, -2 = failed, -3 = chargeback
    payment_status = {
        "2": "paid",
        "0": "pending",
        "-1": "cancelled",
        "-2": "failed",
        "-3": "chargeback",
    }.get(str(status_code), "unknown")

    # Update appointment/billing payment status
    # Try billing_transaction first, then appointment
    from app.models.pos import BillingTransaction
    q = select(BillingTransaction).where(BillingTransaction.invoice_number == order_id)
    result = await session.exec(q)
    txn = result.first()
    if txn:
        txn.status = payment_status
        session.add(txn)
        await session.commit()

    return {"status": "ok", "payment_status": payment_status, "order_id": order_id}


@router.get("/status/{order_id}")
async def payment_status(
    order_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Check payment status for an order."""
    from app.models.pos import BillingTransaction
    q = select(BillingTransaction).where(BillingTransaction.invoice_number == order_id)
    result = await session.exec(q)
    txn = result.first()
    if txn:
        return {"order_id": order_id, "status": txn.status, "amount": txn.net_amount}
    return {"order_id": order_id, "status": "not_found", "amount": 0}
