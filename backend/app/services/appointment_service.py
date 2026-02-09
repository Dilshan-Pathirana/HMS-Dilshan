"""Appointment business logic – Patch 2.2"""
from __future__ import annotations

import json
import random
import string
from datetime import date, datetime, time, timedelta, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from fastapi import HTTPException
from sqlmodel import select, func, or_
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.appointment import Appointment
from app.models.appointment_extras import AppointmentAuditLog, AppointmentSettings
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.branch import Branch
from app.models.user import User


def _verification_code() -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


class AppointmentService:
    """Booking flow, status transitions, cancellation, audit."""

    # ---- Status state machine ----
    VALID_TRANSITIONS = {
        "pending": ["confirmed", "cancelled"],
        "confirmed": ["in_progress", "cancelled", "no_show"],
        "in_progress": ["completed", "cancelled"],
        "completed": [],
        "cancelled": [],
        "no_show": [],
    }

    @staticmethod
    def _can_transition(current: str, target: str) -> bool:
        return target in AppointmentService.VALID_TRANSITIONS.get(current, [])

    # ---- Audit helper ----
    @staticmethod
    async def _audit(
        session: AsyncSession,
        appointment_id: str,
        action: str,
        changed_by: str,
        old_data: Optional[dict] = None,
        new_data: Optional[dict] = None,
    ) -> None:
        log = AppointmentAuditLog(
            appointment_id=appointment_id,
            action=action,
            changed_by=changed_by,
            old_data=json.dumps(old_data, default=str) if old_data else None,
            new_data=json.dumps(new_data, default=str) if new_data else None,
        )
        session.add(log)

    # ---- Core booking ----
    @staticmethod
    async def book(
        session: AsyncSession,
        patient_id: str,
        doctor_id: str,
        branch_id: str,
        appt_date: date,
        appt_time: time,
        booked_by: str,
        reason: Optional[str] = None,
        department: Optional[str] = None,
        is_walk_in: bool = False,
    ) -> Appointment:
        # Check doctor exists
        doctor = await session.get(Doctor, doctor_id)
        if not doctor:
            raise HTTPException(404, "Doctor not found")

        # Check slot not already taken
        existing = await session.exec(
            select(Appointment).where(
                Appointment.doctor_id == doctor_id,
                Appointment.appointment_date == appt_date,
                Appointment.appointment_time == appt_time,
                Appointment.status != "cancelled",
            )
        )
        if existing.first():
            raise HTTPException(409, "Slot already booked")

        appt = Appointment(
            patient_id=patient_id,
            doctor_id=doctor_id,
            branch_id=branch_id,
            appointment_date=appt_date,
            appointment_time=appt_time,
            reason=reason,
            department=department,
            status="confirmed",
            verification_code=_verification_code(),
            is_walk_in=is_walk_in,
        )
        session.add(appt)
        await session.commit()
        await session.refresh(appt)

        await AppointmentService._audit(
            session, appt.id, "created", booked_by,
            new_data={"status": "confirmed", "date": str(appt_date), "time": str(appt_time)},
        )
        await session.commit()
        return appt

    # ---- Status transitions ----
    @staticmethod
    async def change_status(
        session: AsyncSession,
        appointment_id: str,
        new_status: str,
        changed_by: str,
        reason: Optional[str] = None,
    ) -> Appointment:
        appt = await session.get(Appointment, appointment_id)
        if not appt:
            raise HTTPException(404, "Appointment not found")
        if not AppointmentService._can_transition(appt.status, new_status):
            raise HTTPException(400, f"Cannot transition from {appt.status} to {new_status}")

        old_status = appt.status
        appt.status = new_status
        appt.updated_at = datetime.utcnow()

        if new_status == "cancelled":
            appt.cancellation_reason = reason
            appt.cancelled_by = changed_by
        elif new_status == "in_progress":
            appt.check_in_time = datetime.utcnow()
            appt.consultation_start = datetime.utcnow()
        elif new_status == "completed":
            appt.consultation_end = datetime.utcnow()

        session.add(appt)
        await AppointmentService._audit(
            session, appt.id, "status_changed", changed_by,
            old_data={"status": old_status},
            new_data={"status": new_status, "reason": reason},
        )
        await session.commit()
        await session.refresh(appt)
        return appt

    # ---- Reschedule ----
    @staticmethod
    async def reschedule(
        session: AsyncSession,
        appointment_id: str,
        new_date: date,
        new_time: time,
        changed_by: str,
    ) -> Appointment:
        appt = await session.get(Appointment, appointment_id)
        if not appt:
            raise HTTPException(404, "Appointment not found")
        if appt.status in ("completed", "cancelled", "no_show"):
            raise HTTPException(400, f"Cannot reschedule a {appt.status} appointment")

        # Verify new slot available
        existing = await session.exec(
            select(Appointment).where(
                Appointment.doctor_id == appt.doctor_id,
                Appointment.appointment_date == new_date,
                Appointment.appointment_time == new_time,
                Appointment.status != "cancelled",
                Appointment.id != appointment_id,
            )
        )
        if existing.first():
            raise HTTPException(409, "New slot already booked")

        old_data = {"date": str(appt.appointment_date), "time": str(appt.appointment_time)}
        appt.appointment_date = new_date
        appt.appointment_time = new_time
        appt.updated_at = datetime.utcnow()
        session.add(appt)

        await AppointmentService._audit(
            session, appt.id, "rescheduled", changed_by,
            old_data=old_data,
            new_data={"date": str(new_date), "time": str(new_time)},
        )
        await session.commit()
        await session.refresh(appt)
        return appt

    # ---- Payment ----
    @staticmethod
    async def update_payment(
        session: AsyncSession,
        appointment_id: str,
        payment_status: str,
        amount: Optional[float],
        method: Optional[str],
        reference: Optional[str],
        changed_by: str,
    ) -> Appointment:
        appt = await session.get(Appointment, appointment_id)
        if not appt:
            raise HTTPException(404, "Appointment not found")
        old = {"payment_status": appt.payment_status}
        appt.payment_status = payment_status
        appt.payment_amount = amount
        appt.payment_method = method
        appt.payment_reference = reference
        appt.updated_at = datetime.utcnow()
        session.add(appt)

        await AppointmentService._audit(
            session, appt.id, "payment_updated", changed_by,
            old_data=old, new_data={"payment_status": payment_status, "amount": amount},
        )
        await session.commit()
        await session.refresh(appt)
        return appt

    # ---- Listing helpers ----
    @staticmethod
    async def list_by_doctor(
        session: AsyncSession, doctor_id: str, appt_date: Optional[date] = None,
        status: Optional[str] = None, skip: int = 0, limit: int = 50,
    ) -> List[Appointment]:
        q = select(Appointment).where(Appointment.doctor_id == doctor_id)
        if appt_date:
            q = q.where(Appointment.appointment_date == appt_date)
        if status:
            q = q.where(Appointment.status == status)
        q = q.order_by(Appointment.appointment_date, Appointment.appointment_time).offset(skip).limit(limit)  # type: ignore
        result = await session.exec(q)
        return list(result.all())

    @staticmethod
    async def list_by_patient(
        session: AsyncSession, patient_id: str, status: Optional[str] = None,
        skip: int = 0, limit: int = 50,
    ) -> List[Appointment]:
        q = select(Appointment).where(Appointment.patient_id == patient_id)
        if status:
            q = q.where(Appointment.status == status)
        q = q.order_by(Appointment.appointment_date.desc()).offset(skip).limit(limit)  # type: ignore
        result = await session.exec(q)
        return list(result.all())

    @staticmethod
    async def list_by_branch(
        session: AsyncSession, branch_id: str, appt_date: Optional[date] = None,
        status: Optional[str] = None, skip: int = 0, limit: int = 100,
    ) -> List[Appointment]:
        q = select(Appointment).where(Appointment.branch_id == branch_id)
        if appt_date:
            q = q.where(Appointment.appointment_date == appt_date)
        if status:
            q = q.where(Appointment.status == status)
        q = q.order_by(Appointment.appointment_date, Appointment.appointment_time).offset(skip).limit(limit)  # type: ignore
        result = await session.exec(q)
        return list(result.all())

    @staticmethod
    async def get_statistics(
        session: AsyncSession, doctor_id: Optional[str] = None, branch_id: Optional[str] = None,
        from_date: Optional[date] = None, to_date: Optional[date] = None,
    ) -> dict:
        base = select(func.count(Appointment.id))
        filters = []
        if doctor_id:
            filters.append(Appointment.doctor_id == doctor_id)
        if branch_id:
            filters.append(Appointment.branch_id == branch_id)
        if from_date:
            filters.append(Appointment.appointment_date >= from_date)
        if to_date:
            filters.append(Appointment.appointment_date <= to_date)

        async def _count(*extra):
            q = base
            for f in [*filters, *extra]:
                q = q.where(f)
            r = await session.exec(q)
            return r.one() or 0

        total = await _count()
        completed = await _count(Appointment.status == "completed")
        cancelled = await _count(Appointment.status == "cancelled")
        no_show = await _count(Appointment.status == "no_show")
        pending = await _count(Appointment.status == "pending")

        return {
            "total": total,
            "completed": completed,
            "cancelled": cancelled,
            "no_show": no_show,
            "pending": pending,
            "completion_rate": round(completed / total * 100, 1) if total else 0,
        }

    # ---- Audit log retrieval ----
    @staticmethod
    async def get_audit_logs(
        session: AsyncSession, appointment_id: str
    ) -> List[AppointmentAuditLog]:
        q = (
            select(AppointmentAuditLog)
            .where(AppointmentAuditLog.appointment_id == appointment_id)
            .order_by(AppointmentAuditLog.created_at.desc())  # type: ignore
        )
        result = await session.exec(q)
        return list(result.all())

    # ---- Settings ----
    @staticmethod
    async def get_settings(session: AsyncSession, branch_id: str) -> Optional[AppointmentSettings]:
        q = select(AppointmentSettings).where(AppointmentSettings.branch_id == branch_id)
        result = await session.exec(q)
        return result.first()

    @staticmethod
    async def upsert_settings(session: AsyncSession, branch_id: str, data: dict) -> AppointmentSettings:
        existing = await AppointmentService.get_settings(session, branch_id)
        if existing:
            for k, v in data.items():
                if hasattr(existing, k):
                    setattr(existing, k, v)
            existing.updated_at = datetime.utcnow()
            session.add(existing)
        else:
            existing = AppointmentSettings(branch_id=branch_id, **data)
            session.add(existing)
        await session.commit()
        await session.refresh(existing)
        return existing
