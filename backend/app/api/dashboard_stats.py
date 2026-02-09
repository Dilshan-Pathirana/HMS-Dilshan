"""Enhanced Dashboard Stats endpoints — Patch 5.9

Adds dedicated per-role dashboard-stats with real DB queries.
Existing endpoints in other routers are kept — these provide enhanced/additional ones.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select, func
from sqlmodel.ext.asyncio.session import AsyncSession
from datetime import date, datetime, timezone

from app.core.database import get_session
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/doctor/dashboard-stats")
async def doctor_dashboard_stats(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Doctor dashboard: today's patients, upcoming schedules, pending consultations."""
    from app.models.appointment import Appointment
    from app.models.doctor_schedule import DoctorSchedule
    from app.models.consultation import Consultation

    today = date.today()

    # Today's appointments
    q = select(func.count()).select_from(Appointment).where(
        Appointment.doctor_id == current_user.id,
        Appointment.appointment_date == today,
    )
    today_appointments = (await session.exec(q)).one()

    # Total patients (distinct)
    q = select(func.count(func.distinct(Appointment.patient_id))).select_from(Appointment).where(
        Appointment.doctor_id == current_user.id,
    )
    total_patients = (await session.exec(q)).one()

    # Upcoming schedules
    q = select(func.count()).select_from(DoctorSchedule).where(
        DoctorSchedule.doctor_id == current_user.id,
        DoctorSchedule.date >= today,
    )
    upcoming_schedules = (await session.exec(q)).one()

    # Pending consultations
    q = select(func.count()).select_from(Consultation).where(
        Consultation.doctor_id == current_user.id,
        Consultation.status == "in_progress",
    )
    pending_consultations = (await session.exec(q)).one()

    return {
        "today_appointments": today_appointments,
        "total_patients": total_patients,
        "upcoming_schedules": upcoming_schedules,
        "pending_consultations": pending_consultations,
    }


@router.get("/pharmacist/dashboard-stats")
async def pharmacist_dashboard_stats(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Pharmacist dashboard: pending dispensations, low stock, today's transactions."""
    from app.models.pharmacy_inventory import Product, PharmacyStockTransaction, Prescription

    today = date.today()

    # Pending prescriptions
    q = select(func.count()).select_from(Prescription).where(
        Prescription.status == "pending",
    )
    pending_dispensations = (await session.exec(q)).one()

    # Low stock products
    q = select(func.count()).select_from(Product).where(
        Product.is_active == True,
        Product.stock_quantity <= Product.reorder_level,
    )
    low_stock_count = (await session.exec(q)).one()

    # Today's transactions
    q = select(func.count()).select_from(PharmacyStockTransaction).where(
        func.date(PharmacyStockTransaction.created_at) == today,
    )
    today_transactions = (await session.exec(q)).one()

    # Total products
    q = select(func.count()).select_from(Product).where(Product.is_active == True)
    total_products = (await session.exec(q)).one()

    return {
        "pending_dispensations": pending_dispensations,
        "low_stock_count": low_stock_count,
        "today_transactions": today_transactions,
        "total_products": total_products,
    }


@router.get("/cashier/dashboard-stats")
async def cashier_dashboard_stats(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Cashier dashboard: today's sales, pending EOD, transaction count."""
    from app.models.pos import BillingTransaction, EODReport

    today = date.today()

    # Today's transactions
    q = select(func.count()).select_from(BillingTransaction).where(
        func.date(BillingTransaction.created_at) == today,
        BillingTransaction.cashier_id == current_user.id,
    )
    today_transactions = (await session.exec(q)).one()

    # Today's sales total
    q = select(func.coalesce(func.sum(BillingTransaction.net_amount), 0)).select_from(BillingTransaction).where(
        func.date(BillingTransaction.created_at) == today,
        BillingTransaction.cashier_id == current_user.id,
        BillingTransaction.status == "completed",
    )
    today_sales = (await session.exec(q)).one()

    # Pending EOD reports
    q = select(func.count()).select_from(EODReport).where(
        EODReport.cashier_id == current_user.id,
        EODReport.status == "draft",
    )
    pending_eod = (await session.exec(q)).one()

    return {
        "today_transactions": today_transactions,
        "today_sales": float(today_sales),
        "pending_eod": pending_eod,
    }


@router.get("/receptionist/enhanced-stats")
async def receptionist_enhanced_stats(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Receptionist enhanced stats: today's queue, appointments, walk-ins."""
    from app.models.appointment import Appointment
    from app.models.visit import Queue

    today = date.today()

    # Today's appointments
    q = select(func.count()).select_from(Appointment).where(
        Appointment.appointment_date == today,
    )
    today_appointments = (await session.exec(q)).one()

    # Active queue
    q = select(func.count()).select_from(Queue).where(
        func.date(Queue.created_at) == today,
        Queue.status == "waiting",
    )
    active_queue = (await session.exec(q)).one()

    # Completed today
    q = select(func.count()).select_from(Queue).where(
        func.date(Queue.created_at) == today,
        Queue.status == "completed",
    )
    completed_today = (await session.exec(q)).one()

    return {
        "today_appointments": today_appointments,
        "active_queue": active_queue,
        "completed_today": completed_today,
    }
