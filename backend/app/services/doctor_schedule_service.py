"""Doctor schedule business logic – Patch 2.1"""
from __future__ import annotations

import json
from datetime import date, datetime, time, timedelta, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from fastapi import HTTPException
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.doctor_schedule import (
    DoctorSchedule,
    DoctorScheduleCancellation,
    ScheduleModification,
    SlotLock,
)
from app.models.appointment import Appointment


class DoctorScheduleService:
    """Encapsulates schedule CRUD, slot generation, conflict detection, and lock management."""

    # ---- Schedule CRUD ----

    @staticmethod
    async def create_schedule(session: AsyncSession, data: dict) -> DoctorSchedule:
        """Create a new recurring schedule after checking for conflicts."""
        await DoctorScheduleService._check_overlap(session, data)
        schedule = DoctorSchedule(**data)
        session.add(schedule)
        await session.commit()
        await session.refresh(schedule)
        return schedule

    @staticmethod
    async def get_doctor_schedules(
        session: AsyncSession, doctor_id: str, status: Optional[str] = None
    ) -> List[DoctorSchedule]:
        q = select(DoctorSchedule).where(DoctorSchedule.doctor_id == doctor_id)
        if status:
            q = q.where(DoctorSchedule.status == status)
        result = await session.exec(q)
        return list(result.all())

    @staticmethod
    async def update_schedule(
        session: AsyncSession, schedule_id: str, data: dict, modified_by: str
    ) -> DoctorSchedule:
        schedule = await session.get(DoctorSchedule, schedule_id)
        if not schedule:
            raise HTTPException(404, "Schedule not found")

        old_values = {k: getattr(schedule, k) for k in data if hasattr(schedule, k)}

        for key, val in data.items():
            if hasattr(schedule, key):
                setattr(schedule, key, val)
        schedule.updated_at = datetime.utcnow()
        session.add(schedule)

        # audit modification
        mod = ScheduleModification(
            doctor_id=schedule.doctor_id,
            schedule_id=schedule.id,
            modification_type="update",
            old_value=json.dumps(old_values, default=str),
            new_value=json.dumps(data, default=str),
            status="approved",
            approved_by=modified_by,
        )
        session.add(mod)
        await session.commit()
        await session.refresh(schedule)
        return schedule

    @staticmethod
    async def delete_schedule(session: AsyncSession, schedule_id: str) -> None:
        schedule = await session.get(DoctorSchedule, schedule_id)
        if not schedule:
            raise HTTPException(404, "Schedule not found")
        await session.delete(schedule)
        await session.commit()

    # ---- Availability / Slot Generation ----

    @staticmethod
    def generate_slots(start: time, end: time, duration_minutes: int) -> List[time]:
        """Return a list of slot start-times between *start* and *end*."""
        slots: List[time] = []
        cur = datetime.combine(date.min, start)
        end_dt = datetime.combine(date.min, end)
        step = timedelta(minutes=duration_minutes)
        while cur + step <= end_dt:
            slots.append(cur.time())
            cur += step
        return slots

    @staticmethod
    async def check_availability(
        session: AsyncSession,
        doctor_id: str,
        check_date: date,
        branch_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Return available (un-booked, un-locked, un-cancelled) slots for a doctor on a given date."""
        weekday = check_date.weekday()
        q = select(DoctorSchedule).where(
            DoctorSchedule.doctor_id == doctor_id,
            DoctorSchedule.day_of_week == weekday,
            DoctorSchedule.status == "active",
        )
        if branch_id:
            q = q.where(DoctorSchedule.branch_id == branch_id)
        result = await session.exec(q)
        schedules = list(result.all())

        # filter by valid_from / valid_until
        schedules = [
            s for s in schedules
            if (s.valid_from is None or s.valid_from <= check_date)
            and (s.valid_until is None or s.valid_until >= check_date)
        ]

        # check cancellations
        cancel_q = select(DoctorScheduleCancellation).where(
            DoctorScheduleCancellation.doctor_id == doctor_id,
            DoctorScheduleCancellation.status == "approved",
            DoctorScheduleCancellation.cancel_date <= check_date,
        )
        cancel_result = await session.exec(cancel_q)
        cancelled_ids = set()
        for c in cancel_result.all():
            end_d = c.cancel_end_date or c.cancel_date
            if c.cancel_date <= check_date <= end_d:
                cancelled_ids.add(c.schedule_id)

        schedules = [s for s in schedules if s.id not in cancelled_ids]

        # booked appointments
        appt_q = select(Appointment).where(
            Appointment.doctor_id == doctor_id,
            Appointment.appointment_date == check_date,
            Appointment.status != "cancelled",
        )
        appt_result = await session.exec(appt_q)
        booked_times = {a.appointment_time for a in appt_result.all()}

        # active slot locks
        now = datetime.now(timezone.utc)
        lock_q = select(SlotLock).where(
            SlotLock.doctor_id == doctor_id,
            SlotLock.slot_date == check_date,
            SlotLock.expires_at > now,
        )
        lock_result = await session.exec(lock_q)
        locked_times = {lk.slot_time for lk in lock_result.all()}

        result_slots: List[Dict[str, Any]] = []
        for sched in schedules:
            all_slots = DoctorScheduleService.generate_slots(
                sched.start_time, sched.end_time, sched.slot_duration_minutes
            )
            available = [
                t for t in all_slots if t not in booked_times and t not in locked_times
            ]
            result_slots.append({
                "schedule_id": sched.id,
                "branch_id": sched.branch_id,
                "start_time": sched.start_time.isoformat(),
                "end_time": sched.end_time.isoformat(),
                "slot_duration_minutes": sched.slot_duration_minutes,
                "available_slots": [t.strftime("%H:%M") for t in available],
                "total_slots": len(all_slots),
                "booked_slots": len(all_slots) - len(available),
            })
        return result_slots

    # ---- Cancellation Workflow ----

    @staticmethod
    async def request_cancellation(session: AsyncSession, data: dict) -> DoctorScheduleCancellation:
        cancel = DoctorScheduleCancellation(**data)
        session.add(cancel)
        await session.commit()
        await session.refresh(cancel)
        return cancel

    @staticmethod
    async def approve_cancellation(session: AsyncSession, cancel_id: str, approved_by: str) -> DoctorScheduleCancellation:
        cancel = await session.get(DoctorScheduleCancellation, cancel_id)
        if not cancel:
            raise HTTPException(404, "Cancellation request not found")
        cancel.status = "approved"
        cancel.approved_by = approved_by
        session.add(cancel)
        await session.commit()
        await session.refresh(cancel)
        return cancel

    @staticmethod
    async def reject_cancellation(session: AsyncSession, cancel_id: str, approved_by: str) -> DoctorScheduleCancellation:
        cancel = await session.get(DoctorScheduleCancellation, cancel_id)
        if not cancel:
            raise HTTPException(404, "Cancellation request not found")
        cancel.status = "rejected"
        cancel.approved_by = approved_by
        session.add(cancel)
        await session.commit()
        await session.refresh(cancel)
        return cancel

    @staticmethod
    async def list_cancellation_requests(
        session: AsyncSession, status: Optional[str] = None, doctor_id: Optional[str] = None
    ) -> List[DoctorScheduleCancellation]:
        q = select(DoctorScheduleCancellation)
        if status:
            q = q.where(DoctorScheduleCancellation.status == status)
        if doctor_id:
            q = q.where(DoctorScheduleCancellation.doctor_id == doctor_id)
        result = await session.exec(q)
        return list(result.all())

    # ---- Schedule Modifications CRUD ----

    @staticmethod
    async def list_modifications(
        session: AsyncSession, schedule_id: Optional[str] = None
    ) -> List[ScheduleModification]:
        q = select(ScheduleModification)
        if schedule_id:
            q = q.where(ScheduleModification.schedule_id == schedule_id)
        q = q.order_by(ScheduleModification.created_at.desc())  # type: ignore
        result = await session.exec(q)
        return list(result.all())

    # ---- Slot Lock helpers ----

    @staticmethod
    async def lock_slot(
        session: AsyncSession, doctor_id: str, slot_date: date, slot_time: time,
        locked_by: str, schedule_id: Optional[str] = None, ttl_minutes: int = 5,
    ) -> SlotLock:
        lock = SlotLock(
            doctor_id=doctor_id,
            schedule_id=schedule_id,
            slot_date=slot_date,
            slot_time=slot_time,
            locked_by=locked_by,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=ttl_minutes),
        )
        session.add(lock)
        await session.commit()
        await session.refresh(lock)
        return lock

    @staticmethod
    async def release_expired_locks(session: AsyncSession) -> int:
        now = datetime.now(timezone.utc)
        q = select(SlotLock).where(SlotLock.expires_at <= now, SlotLock.appointment_id == None)  # noqa: E711
        result = await session.exec(q)
        expired = list(result.all())
        for lk in expired:
            await session.delete(lk)
        if expired:
            await session.commit()
        return len(expired)

    # ---- Internal helpers ----

    @staticmethod
    async def _check_overlap(session: AsyncSession, data: dict) -> None:
        """Raise 409 if a schedule already exists for the same doctor + branch + day overlapping time range."""
        q = select(DoctorSchedule).where(
            DoctorSchedule.doctor_id == data["doctor_id"],
            DoctorSchedule.branch_id == data["branch_id"],
            DoctorSchedule.day_of_week == data["day_of_week"],
            DoctorSchedule.status == "active",
        )
        result = await session.exec(q)
        for existing in result.all():
            if data["start_time"] < existing.end_time and data["end_time"] > existing.start_time:
                raise HTTPException(409, "Schedule overlaps with an existing active schedule")
