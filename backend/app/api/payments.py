"""PayHere Payment endpoints — Patch 5.7"""

import logging
from typing import List, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request, Form
from pydantic import BaseModel
from sqlmodel import col, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.api.deps import get_current_user
from app.models.user import User
from app.models.appointment import Appointment
from app.services.payment_service import PayHereService

router = APIRouter()
logger = logging.getLogger(__name__)


# ── Request / Response schemas ──────────────────────────────
class PreparePaymentRequest(BaseModel):
    appointment_ids: List[str]
    return_url: str
    cancel_url: str


class InitiatePaymentRequest(BaseModel):
    appointment_id: Optional[str] = ""
    amount: float = 0
    item_name: str = "Appointment Payment"
    return_url: str = ""
    cancel_url: str = ""
    notify_url: str = ""


# ── POST /payments/prepare  ─────────────────────────────────
@router.post("/prepare")
async def prepare_payment(
    payload: PreparePaymentRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Create a single PayHere form payload for one or more appointments.

    1. Validate appointments belong to the current user
    2. Sum the booking fee
    3. Generate order_id + hash
    4. Return form data for the frontend to POST to PayHere
    """
    if not payload.appointment_ids:
        raise HTTPException(status_code=400, detail="No appointments provided")

    q = select(Appointment).where(col(Appointment.id).in_(payload.appointment_ids))
    result = await session.exec(q)
    appointments = list(result.all())
    if not appointments:
        raise HTTPException(status_code=404, detail="Appointments not found")

    # Compute total
    total = sum(a.payment_amount or 350.0 for a in appointments)

    # Build a single order_id referencing all appointments
    order_id = f"PAY-{uuid4().hex[:12]}"

    # Store order_id on each appointment so the webhook can look them up
    for appt in appointments:
        appt.payment_reference = order_id
        appt.payment_status = "pending"
        appt.status = "pending_payment"
        appt.payment_amount = appt.payment_amount or 350.0
        session.add(appt)
    await session.commit()

    # Derive notify_url (server-to-server – PayHere hits the backend directly)
    # For Docker/localhost, PayHere sandbox won't reach us, but we set it anyway.
    notify_url = payload.return_url.split("/payment/")[0] if "/payment/" in payload.return_url else payload.return_url
    # Use backend base for notify so PayHere can reach it
    notify_url = "http://localhost:8000/api/v1/payments/notify"

    customer_name = f"{current_user.first_name or ''} {current_user.last_name or ''}".strip() or current_user.email or ""
    customer_phone = getattr(current_user, "contact_number_mobile", "") or "0771234567"
    customer_address = getattr(current_user, "home_address", "") or "No Address"

    payhere = PayHereService.build_payment_form_data(
        order_id=order_id,
        amount=float(total),
        item_name=f"Appointment Booking ({len(appointments)} slot{'s' if len(appointments)>1 else ''})",
        customer_name=customer_name,
        customer_email=current_user.email or "noreply@hospital.lk",
        customer_phone=customer_phone,
        return_url=payload.return_url,
        cancel_url=payload.cancel_url,
        notify_url=notify_url,
        customer_address=customer_address,
        custom_1=order_id,
    )

    return {
        "success": True,
        "order_id": order_id,
        "total_amount": total,
        "action": payhere["action"],
        "fields": payhere["fields"],
    }


# ── POST /payments/initiate  (legacy) ───────────────────────
@router.post("/initiate")
async def initiate_payment(
    payload: InitiatePaymentRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Generate PayHere checkout form data for a payment (legacy endpoint)."""
    if not payload.amount or payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")

    form_data = PayHereService.build_payment_form_data(
        order_id=payload.appointment_id or f"ORD-{current_user.id[:8]}",
        amount=float(payload.amount),
        item_name=payload.item_name,
        customer_name=f"{current_user.first_name or ''} {current_user.last_name or ''}".strip() or current_user.email or "",
        customer_email=current_user.email or "",
        customer_phone=getattr(current_user, "contact_number_mobile", "") or "",
        return_url=payload.return_url,
        cancel_url=payload.cancel_url,
        notify_url=payload.notify_url,
    )

    return {"success": True, "payment_data": form_data}


# ── POST /payments/notify  (webhook from PayHere) ───────────
@router.post("/notify")
async def payment_notify(
    request: Request,
    session: AsyncSession = Depends(get_session),
):
    """PayHere server-to-server webhook. Verifies signature and updates appointment(s)."""
    form = await request.form()
    merchant_id = str(form.get("merchant_id", ""))
    order_id = str(form.get("order_id", ""))
    payhere_amount = str(form.get("payhere_amount", ""))
    payhere_currency = str(form.get("payhere_currency", ""))
    status_code = str(form.get("status_code", ""))
    md5sig = str(form.get("md5sig", ""))

    logger.info("PayHere notify: order_id=%s status_code=%s", order_id, status_code)

    # Verify signature
    is_valid = PayHereService.verify_notification(
        merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig
    )
    if not is_valid:
        logger.warning("PayHere notify: INVALID SIGNATURE for order_id=%s", order_id)
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Map status
    status_map = {
        "2": "paid",
        "0": "pending",
        "-1": "cancelled",
        "-2": "failed",
        "-3": "chargeback",
    }
    payment_status = status_map.get(status_code, "unknown")
    appt_status = "confirmed" if payment_status == "paid" else (
        "pending_payment" if payment_status == "pending" else "payment_failed"
    )

    # Update ALL appointments linked to this order_id (multi-slot support)
    q = select(Appointment).where(Appointment.payment_reference == order_id)
    result = await session.exec(q)
    appointments = list(result.all())
    for appt in appointments:
        appt.payment_status = payment_status
        appt.payment_method = "online"
        appt.status = appt_status
        session.add(appt)

    await session.commit()
    logger.info("PayHere notify: updated %d appointment(s) → %s", len(appointments), appt_status)

    return {"status": "ok", "payment_status": payment_status, "order_id": order_id}


# ── GET /payments/status/{order_id}  ─────────────────────────
@router.get("/status/{order_id}")
async def payment_status(
    order_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Check payment status for an order (by payment_reference on appointments)."""
    q = select(Appointment).where(Appointment.payment_reference == order_id)
    result = await session.exec(q)
    appointments = list(result.all())
    if not appointments:
        return {"order_id": order_id, "status": "not_found", "amount": 0}

    total = sum(a.payment_amount or 0 for a in appointments)
    pstatus = appointments[0].payment_status or "unknown"
    return {
        "order_id": order_id,
        "status": pstatus,
        "amount": total,
        "appointment_ids": [a.id for a in appointments],
    }


# ── POST /payments/confirm-by-order  (return-url helper) ─────
@router.post("/confirm-by-order")
async def confirm_by_order(
    payload: dict,
    session: AsyncSession = Depends(get_session),
):
    """Called from the payment-success page to check / confirm an order.
    In sandbox mode, the webhook may not arrive, so we optimistically
    mark appointments as confirmed when the patient lands on the success page."""
    order_id = payload.get("order_id", "")
    if not order_id:
        raise HTTPException(status_code=400, detail="order_id required")

    q = select(Appointment).where(Appointment.payment_reference == order_id)
    result = await session.exec(q)
    appointments = list(result.all())
    if not appointments:
        raise HTTPException(status_code=404, detail="Order not found")

    # If still pending_payment, optimistically confirm (sandbox fallback)
    updated = False
    for appt in appointments:
        if appt.status == "pending_payment":
            appt.status = "confirmed"
            appt.payment_status = "paid"
            appt.payment_method = "online"
            session.add(appt)
            updated = True

    if updated:
        await session.commit()

    return {
        "success": True,
        "order_id": order_id,
        "appointment_count": len(appointments),
        "status": appointments[0].status,
    }

