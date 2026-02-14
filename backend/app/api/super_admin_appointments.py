"""Super-admin appointment endpoints.

Prefix: /api/v1/super-admin/appointments

These endpoints are primarily an adapter for the current frontend.
They provide:
- branch list for appointment filters
- doctor list for appointment filters
- cross-branch appointment list + pagination
"""

from __future__ import annotations

from datetime import date as date_type
from datetime import datetime, time as time_type
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlmodel import col, func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.deps import get_current_active_superuser
from app.core.database import get_session
from app.models.appointment import Appointment
from app.models.appointment_extras import AppointmentAuditLog, AppointmentSettings
from app.models.branch import Branch
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.user import User
from app.services.appointment_service import AppointmentService
from app.services.doctor_schedule_service import DoctorScheduleService

router = APIRouter()
svc = AppointmentService()


def _full_name(first_name: Optional[str], last_name: Optional[str]) -> str:
    return " ".join([p for p in [(first_name or "").strip(), (last_name or "").strip()] if p]).strip()


def _map_appt_status_to_frontend(status: Optional[str]) -> str:
    if not status:
        return "pending"
    mapping = {
        "pending": "pending_payment",
        "confirmed": "confirmed",
        "in_progress": "in_session",
        "completed": "completed",
        "cancelled": "cancelled",
        "no_show": "no_show",
    }
    return mapping.get(status, status)


def _map_payment_status_to_frontend(status: Optional[str]) -> str:
    mapping = {
        "unpaid": "pending",
        "paid": "paid",
        "refunded": "refunded",
        "partial": "pending",
    }
    return mapping.get((status or "unpaid"), "pending")


async def _get_patient_name(session: AsyncSession, patient_id: Optional[str]) -> str:
    if not patient_id:
        return ""
    patient_user_id_result = await session.exec(
        select(Patient.user_id).where(Patient.id == patient_id)
    )
    patient_user_id = patient_user_id_result.first()
    if not patient_user_id:
        return ""
    user_result = await session.exec(
        select(User.first_name, User.last_name, User.email).where(User.id == patient_user_id)
    )
    user_row = user_result.first()
    if not user_row:
        return ""
    first_name, last_name, email = user_row
    return _full_name(first_name, last_name) or (email or "")


async def _get_branch_name(session: AsyncSession, branch_id: Optional[str]) -> str:
    if not branch_id:
        return ""
    branch_name_result = await session.exec(
        select(Branch.center_name).where(Branch.id == branch_id)
    )
    branch_name = branch_name_result.first()
    return branch_name or ""


async def _get_doctor_info(session: AsyncSession, doctor_id: Optional[str]) -> Dict[str, str]:
    if not doctor_id:
        return {"name": "", "specialization": ""}
    doctor_result = await session.exec(
        select(Doctor.first_name, Doctor.last_name, Doctor.specialization).where(Doctor.id == doctor_id)
    )
    doctor_row = doctor_result.first()
    if not doctor_row:
        return {"name": "", "specialization": ""}
    first_name, last_name, specialization = doctor_row
    return {
        "name": _full_name(first_name, last_name),
        "specialization": specialization or "",
    }


def _format_appointment_time(value: Any) -> str:
    if isinstance(value, time_type):
        return value.strftime("%H:%M")
    if isinstance(value, str):
        try:
            return datetime.strptime(value, "%H:%M:%S").strftime("%H:%M")
        except ValueError:
            try:
                return datetime.strptime(value, "%H:%M").strftime("%H:%M")
            except ValueError:
                return "00:00"
    return "00:00"


class SlotInfo(BaseModel):
    slot_number: int
    time: str
    is_available: bool


async def _available_slot_times(
    session: AsyncSession,
    doctor_id: str,
    appt_date: date_type,
    branch_id: Optional[str] = None,
) -> List[str]:
    blocks = await DoctorScheduleService.check_availability(
        session, doctor_id=doctor_id, check_date=appt_date, branch_id=branch_id
    )
    times: List[str] = []
    for block in blocks:
        times.extend(block.get("available_slots") or [])
    # stable ordering
    return sorted({t for t in times})


@router.get("/branches")
async def branches(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser),
):
    result = await session.exec(select(Branch).order_by(Branch.center_name))
    items = result.all() or []
    return {
        "status": 200,
        "branches": [
            {
                "id": b.id,
                "name": b.center_name,
                "location": b.division,
                "address": None,
            }
            for b in items
        ],
    }


@router.get("/doctors")
async def doctors(
    branch_id: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser),
):
    from app.models.doctor_branch_link import DoctorBranchLink

    q = select(Doctor)
    if branch_id:
        q = (
            q.join(DoctorBranchLink, col(DoctorBranchLink.doctor_id) == Doctor.id)
            .where(DoctorBranchLink.branch_id == branch_id)
        )
    q = q.order_by(Doctor.first_name, Doctor.last_name)
    result = await session.exec(q)
    items = result.all() or []

    branch_name_map: dict[str, str] = {}
    branch_id_map: dict[str, str] = {}
    if not branch_id and items:
        doctor_ids = [d.id for d in items]
        link_result = await session.exec(
            select(DoctorBranchLink).where(col(DoctorBranchLink.doctor_id).in_(doctor_ids))
        )
        links = link_result.all() or []
        first_links: dict[str, str] = {}
        for link in links:
            if link.doctor_id not in first_links:
                first_links[link.doctor_id] = link.branch_id
        branch_id_map = first_links

        if branch_id_map:
            branch_ids = list({bid for bid in branch_id_map.values() if bid})
            branch_result = await session.exec(select(Branch).where(col(Branch.id).in_(branch_ids)))
            branches = branch_result.all() or []
            branch_name_map = {b.id: b.center_name for b in branches}

    doctor_list = []
    for d in items:
        selected_branch_id = branch_id or branch_id_map.get(d.id)
        selected_branch_name = None
        if selected_branch_id:
            selected_branch_name = branch_name_map.get(selected_branch_id)
            if not selected_branch_name and branch_id:
                selected_branch_name = await _get_branch_name(session, selected_branch_id)
        doctor_list.append(
            {
                "doctor_id": d.id,
                "name": _full_name(d.first_name, d.last_name),
                "specialization": d.specialization,
                "branch_id": selected_branch_id,
                "branch_name": selected_branch_name,
                "profile_picture": None,
            }
        )
    return {"status": 200, "doctors": doctor_list}


@router.get("/count")
async def get_appointment_count(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser),
):
    """Simple endpoint to get appointment count for debugging."""
    try:
        result = await session.exec(select(func.count(Appointment.id)))
        count = int(result.one() or 0)
        return {"status": 200, "count": count}
    except Exception as e:
        return {"status": 500, "error": str(e)}


@router.get("/raw")
async def list_appointments_raw(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=200),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser),
):
    """Raw appointments endpoint for debugging - returns basic appointment data without joins."""
    q = select(Appointment)

    # total
    total_q = select(func.count()).select_from(q.subquery())
    total_result = await session.exec(total_q)
    total = int(total_result.one() or 0)

    offset = (page - 1) * per_page
    q = q.offset(offset).limit(per_page)
    result = await session.exec(q)
    appts = result.all() or []

    out = []
    for a in appts:
        out.append({
            "id": a.id,
            "patient_id": a.patient_id,
            "doctor_id": a.doctor_id,
            "branch_id": a.branch_id,
            "appointment_date": str(a.appointment_date) if a.appointment_date else None,
            "appointment_time": str(a.appointment_time) if a.appointment_time else None,
            "status": a.status,
            "payment_status": a.payment_status,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        })

    return {
        "status": 200,
        "appointments": out,
        "pagination": {"total": total, "page": page, "per_page": per_page, "total_pages": (total + per_page - 1) // per_page},
    }


@router.get("/")
async def list_appointments(
    date: Optional[str] = None,
    branch_id: Optional[str] = None,
    doctor_id: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=200),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser),
):
    q = select(Appointment)

    def _parse_date(v: str) -> date_type:
        return datetime.strptime(v, "%Y-%m-%d").date()

    if date:
        try:
            parsed_date = _parse_date(date)
            q = q.where(Appointment.appointment_date == parsed_date)
        except ValueError:
            pass
    if start_date:
        try:
            parsed_start = _parse_date(start_date)
            q = q.where(Appointment.appointment_date >= parsed_start)
        except ValueError:
            pass
    if end_date:
        try:
            parsed_end = _parse_date(end_date)
            q = q.where(Appointment.appointment_date <= parsed_end)
        except ValueError:
            pass
    if branch_id:
        q = q.where(Appointment.branch_id == branch_id)
    if doctor_id:
        q = q.where(Appointment.doctor_id == doctor_id)
    if status:
        reverse_map = {
            "pending_payment": "pending",
            "in_session": "in_progress",
            "checked_in": "in_progress",
        }
        q = q.where(Appointment.status == reverse_map.get(status, status))

    # total: build a count query applying the same filters (avoid subquery issues)
    total_q = select(func.count(Appointment.id))
    if date:
        try:
            parsed_date = _parse_date(date)
            total_q = total_q.where(Appointment.appointment_date == parsed_date)
        except ValueError:
            pass
    if start_date:
        try:
            parsed_start = _parse_date(start_date)
            total_q = total_q.where(Appointment.appointment_date >= parsed_start)
        except ValueError:
            pass
    if end_date:
        try:
            parsed_end = _parse_date(end_date)
            total_q = total_q.where(Appointment.appointment_date <= parsed_end)
        except ValueError:
            pass
    if branch_id:
        total_q = total_q.where(Appointment.branch_id == branch_id)
    if doctor_id:
        total_q = total_q.where(Appointment.doctor_id == doctor_id)
    if status:
        total_q = total_q.where(Appointment.status == reverse_map.get(status, status))

    total_result = await session.exec(total_q)
    total = int(total_result.one() or 0)

    offset = (page - 1) * per_page
    q = (
        q.order_by(
            col(Appointment.appointment_date).desc(),
            col(Appointment.appointment_time).desc(),
        )
        .offset(offset)
        .limit(per_page)
    )
    result = await session.exec(q)
    appts = result.all() or []
    total_pages = (total + per_page - 1) // per_page if per_page else 1

    out = []
    for a in appts:
        try:
            patient_name = "Unknown Patient"
            try:
                patient_name = await _get_patient_name(session, a.patient_id)
            except Exception:
                pass

            doc = {"name": "Unknown Doctor", "specialization": "Unknown"}
            try:
                doc = await _get_doctor_info(session, a.doctor_id)
            except Exception:
                pass

            branch_name = "Unknown Branch"
            try:
                branch_name = await _get_branch_name(session, a.branch_id)
            except Exception:
                pass

            appointment_data = {
                "id": a.id,
                "patient_id": a.patient_id,
                "patient_name": patient_name,
                "patient_phone": None,
                "patient_email": None,
                "doctor_id": a.doctor_id,
                "doctor_name": doc.get("name"),
                "doctor_specialization": doc.get("specialization"),
                "specialization": doc.get("specialization"),
                "branch_id": a.branch_id,
                "branch_name": branch_name,
                "appointment_date": str(a.appointment_date) if a.appointment_date else "",
                "appointment_time": _format_appointment_time(a.appointment_time),
                "slot_number": 0,
                "token_number": a.queue_number or 0,
                "appointment_type": "general",
                "booking_type": "walk_in" if a.is_walk_in else "online",
                "status": _map_appt_status_to_frontend(a.status),
                "payment_status": _map_payment_status_to_frontend(a.payment_status),
                "payment_method": a.payment_method,
                "booking_fee": None,
                "amount_paid": a.payment_amount,
                "notes": a.notes,
                "cancellation_reason": a.cancellation_reason,
                "cancelled_by_admin_for_doctor": False,
                "created_at": a.created_at.isoformat() if a.created_at else "",
            }
            out.append(appointment_data)
        except Exception:
            # Skip problematic appointment entries
            continue

    return {
        "status": 200,
        "appointments": out,
        "pagination": {"total": total, "page": page, "per_page": per_page, "total_pages": total_pages},
    }


@router.get("/available-slots")
async def available_slots(
    doctor_id: str,
    date: str,
    branch_id: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser),
):
    try:
        appt_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(422, "Invalid date format. Use YYYY-MM-DD")

    times = await _available_slot_times(session, doctor_id, appt_date, branch_id)
    slots = [SlotInfo(slot_number=i + 1, time=t, is_available=True).model_dump() for i, t in enumerate(times)]
    return {"status": 200, "slots": slots}


class CreateAppointmentPayload(BaseModel):
    branch_id: str
    patient_id: str
    doctor_id: str
    appointment_date: str
    slot_number: int
    booking_type: Optional[str] = "online"
    payment_status: Optional[str] = "pending"
    notes: Optional[str] = None


@router.post("/create")
async def create_appointment(
    payload: CreateAppointmentPayload,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser),
):
    try:
        appt_date = datetime.strptime(payload.appointment_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(422, "Invalid appointment_date format. Use YYYY-MM-DD")

    times = await _available_slot_times(session, payload.doctor_id, appt_date, payload.branch_id)
    if payload.slot_number < 1 or payload.slot_number > len(times):
        raise HTTPException(422, "Invalid slot_number")

    appt_time = datetime.strptime(times[payload.slot_number - 1], "%H:%M").time()
    appt = await svc.book(
        session,
        patient_id=payload.patient_id,
        doctor_id=payload.doctor_id,
        branch_id=payload.branch_id,
        appt_date=appt_date,
        appt_time=appt_time,
        booked_by=current_user.id,
        reason=None,
        department=None,
        is_walk_in=(payload.booking_type == "walk_in"),
    )

    # payment_status adapter
    if payload.payment_status and payload.payment_status != "pending":
        appt.payment_status = "paid" if payload.payment_status == "paid" else appt.payment_status
        session.add(appt)
        await session.commit()
        await session.refresh(appt)

    return {
        "status": 200,
        "message": "Appointment created",
        "appointment": {
            "id": appt.id,
            "token_number": appt.queue_number or 0,
            "appointment_date": str(appt.appointment_date),
            "appointment_time": appt.appointment_time.strftime("%H:%M"),
        },
    }


class CancelPayload(BaseModel):
    reason: Optional[str] = None
    is_doctor_request: Optional[bool] = False
    override_restrictions: Optional[bool] = True


@router.post("/{booking_id}/cancel")
async def cancel(
    booking_id: str,
    payload: CancelPayload = CancelPayload(),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser),
):
    await svc.change_status(session, booking_id, "cancelled", current_user.id, payload.reason)
    return {"status": 200, "message": "Appointment cancelled"}


class ReschedulePayload(BaseModel):
    new_date: str
    new_slot_number: int
    new_doctor_id: Optional[str] = None
    new_branch_id: Optional[str] = None
    reason: Optional[str] = None
    override_restrictions: Optional[bool] = True


@router.post("/{booking_id}/reschedule")
async def reschedule(
    booking_id: str,
    payload: ReschedulePayload,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser),
):
    appt = await session.get(Appointment, booking_id)
    if not appt:
        raise HTTPException(404, "Appointment not found")

    try:
        appt_date = datetime.strptime(payload.new_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(422, "Invalid new_date format. Use YYYY-MM-DD")

    target_doctor_id = payload.new_doctor_id or appt.doctor_id
    target_branch_id = payload.new_branch_id or appt.branch_id

    times = await _available_slot_times(session, target_doctor_id, appt_date, target_branch_id)
    if payload.new_slot_number < 1 or payload.new_slot_number > len(times):
        raise HTTPException(422, "Invalid new_slot_number")

    new_time = datetime.strptime(times[payload.new_slot_number - 1], "%H:%M").time()

    # Ensure slot not already taken
    existing = await session.exec(
        select(Appointment).where(
            Appointment.doctor_id == target_doctor_id,
            Appointment.appointment_date == appt_date,
            Appointment.appointment_time == new_time,
            Appointment.status != "cancelled",
            Appointment.id != appt.id,
        )
    )
    if existing.first():
        raise HTTPException(409, "New slot already booked")

    old = {"date": str(appt.appointment_date), "time": appt.appointment_time.strftime("%H:%M")}

    appt.doctor_id = target_doctor_id
    appt.branch_id = target_branch_id
    appt.appointment_date = appt_date
    appt.appointment_time = new_time
    appt.updated_at = datetime.utcnow()
    session.add(appt)

    log = AppointmentAuditLog(
        appointment_id=appt.id,
        action="rescheduled",
        changed_by=current_user.id,
        old_data=str(old),
        new_data=str({"date": str(appt_date), "time": new_time.strftime("%H:%M"), "reason": payload.reason}),
    )
    session.add(log)

    await session.commit()
    await session.refresh(appt)

    return {
        "status": 200,
        "message": "Appointment rescheduled",
        "old_booking_id": booking_id,
        "new_booking": {
            "id": appt.id,
            "token_number": appt.queue_number or 0,
            "appointment_date": str(appt.appointment_date),
            "appointment_time": appt.appointment_time.strftime("%H:%M"),
        },
    }


class StatusPayload(BaseModel):
    status: str
    reason: Optional[str] = None


@router.post("/{booking_id}/status")
async def update_status(
    booking_id: str,
    payload: StatusPayload,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser),
):
    map_in = {
        "checked_in": "in_progress",
        "in_session": "in_progress",
        "pending_payment": "pending",
    }
    target = map_in.get(payload.status, payload.status)
    await svc.change_status(session, booking_id, target, current_user.id, payload.reason)
    return {"status": 200, "message": "Status updated", "new_status": payload.status}


@router.get("/statistics")
async def statistics(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser),
):
    today = date_type.today()

    async def _count(*conds) -> int:
        q = select(func.count(Appointment.id))
        for c in conds:
            q = q.where(c)
        r = await session.exec(q)
        return int(r.one() or 0)

    total_today = await _count(Appointment.appointment_date == today)
    confirmed_today = await _count(Appointment.appointment_date == today, Appointment.status == "confirmed")
    completed_today = await _count(Appointment.appointment_date == today, Appointment.status == "completed")
    cancelled_today = await _count(Appointment.appointment_date == today, Appointment.status == "cancelled")
    no_show_today = await _count(Appointment.appointment_date == today, Appointment.status == "no_show")

    # by_branch (today)
    by_branch_q = (
        select(Appointment.branch_id, func.count(Appointment.id))
        .where(Appointment.appointment_date == today)
        .group_by(Appointment.branch_id)
    )
    by_branch_r = await session.exec(by_branch_q)
    by_branch_items = []
    for bid, cnt in by_branch_r.all() or []:
        by_branch_items.append(
            {
                "branch_id": bid,
                "branch_name": await _get_branch_name(session, bid),
                "total_appointments": int(cnt or 0),
                "completed": 0,
                "revenue": 0,
            }
        )

    return {
        "status": 200,
        "statistics": {
            "today": {
                "total": total_today,
                "confirmed": confirmed_today,
                "completed": completed_today,
                "cancelled": cancelled_today,
                "no_show": no_show_today,
                "walk_in": 0,
                "online": 0,
            },
            "this_month": {"total": 0, "completed": 0, "cancelled": 0, "revenue": 0},
            "by_branch": by_branch_items,
        },
    }


@router.get("/audit-logs")
async def audit_logs(
    branch_id: Optional[str] = None,
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=200),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser),
):
    q = select(AppointmentAuditLog)
    if branch_id:
        # Join via appointment ids for branch filter
        appt_ids_result = await session.exec(select(Appointment.id).where(Appointment.branch_id == branch_id))
        appt_ids = [r for r in (appt_ids_result.all() or [])]
        if appt_ids:
            q = q.where(col(AppointmentAuditLog.appointment_id).in_(appt_ids))
        else:
            return {
                "status": 200,
                "logs": [],
                "pagination": {"total": 0, "page": page, "per_page": per_page, "total_pages": 0},
            }

    total_q = select(func.count()).select_from(q.subquery())
    total_r = await session.exec(total_q)
    total = int(total_r.one() or 0)

    offset = (page - 1) * per_page
    q = (
        q.order_by(col(AppointmentAuditLog.created_at).desc())
        .offset(offset)
        .limit(per_page)
    )
    result = await session.exec(q)
    logs = result.all() or []

    out = []
    for l in logs:
        out.append(
            {
                "id": l.id,
                "appointment_id": l.appointment_id,
                "action": l.action,
                "performed_by": l.changed_by,
                "performed_by_id": l.changed_by,
                "performed_by_role": "super_admin",
                "reason": None,
                "metadata": None,
                "ip_address": None,
                "user_agent": None,
                "created_at": l.created_at.isoformat() if l.created_at else "",
                "action_label": l.action,
            }
        )

    total_pages = (total + per_page - 1) // per_page if per_page else 1
    return {
        "status": 200,
        "logs": out,
        "pagination": {"total": total, "page": page, "per_page": per_page, "total_pages": total_pages},
    }


@router.get("/branch-settings")
async def branch_settings(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser),
):
    branches_result = await session.exec(select(Branch).order_by(Branch.center_name))
    branches_list = branches_result.all() or []

    out = []
    for b in branches_list:
        settings_result = await session.exec(select(AppointmentSettings).where(AppointmentSettings.branch_id == b.id))
        s = settings_result.first()

        out.append(
            {
                "branch_id": b.id,
                "branch_name": b.center_name,
                "location": b.division,
                "has_settings": bool(s),
                "settings": {
                    "id": s.id if s else None,
                    "branch_id": b.id,
                    "max_advance_booking_days": s.booking_advance_days if s else 30,
                    "min_advance_booking_hours": 0,
                    "default_max_patients_per_session": s.max_daily_appointments if s else 50,
                    "default_time_per_patient": s.slot_duration if s else 30,
                    "allow_walk_in": True,
                    "require_payment_for_online": bool(s.payment_required) if s else False,
                    "allow_cash_payment": True,
                    "allow_reschedule": True,
                    "max_reschedule_count": 2,
                    "reschedule_advance_hours": 24,
                    "allow_patient_cancellation": True,
                    "cancellation_advance_hours": s.cancellation_deadline_hours if s else 24,
                    "refund_on_cancellation": True,
                    "cancellation_fee_percentage": 0,
                    "default_booking_fee": 0,
                    "walk_in_fee": 0,
                    "send_sms_confirmation": False,
                    "send_sms_reminder": False,
                    "reminder_hours_before": 24,
                    "send_email_confirmation": False,
                },
            }
        )

    return {"status": 200, "branches": out}


@router.put("/branch-settings/{branch_id}")
async def update_branch_settings(
    branch_id: str,
    payload: Dict[str, Any] = Body(default_factory=dict),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser),
):
    settings_result = await session.exec(select(AppointmentSettings).where(AppointmentSettings.branch_id == branch_id))
    settings = settings_result.first()
    if not settings:
        settings = AppointmentSettings(branch_id=branch_id)

    # Map a subset of frontend fields to our persisted settings.
    if "default_max_patients_per_session" in payload:
        settings.max_daily_appointments = int(payload.get("default_max_patients_per_session") or settings.max_daily_appointments)
    if "default_time_per_patient" in payload:
        settings.slot_duration = int(payload.get("default_time_per_patient") or settings.slot_duration)
    if "max_advance_booking_days" in payload:
        settings.booking_advance_days = int(payload.get("max_advance_booking_days") or settings.booking_advance_days)
    if "cancellation_advance_hours" in payload:
        settings.cancellation_deadline_hours = int(payload.get("cancellation_advance_hours") or settings.cancellation_deadline_hours)
    if "require_payment_for_online" in payload:
        settings.payment_required = bool(payload.get("require_payment_for_online"))

    session.add(settings)
    await session.commit()
    await session.refresh(settings)

    return {
        "status": 200,
        "message": "Branch settings updated",
        "settings": {
            "id": settings.id,
            "branch_id": settings.branch_id,
        },
    }


@router.get("/search-patients")
async def search_patients(
    query: str,
    branch_id: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser),
):
    q = (query or "").strip().lower()
    if not q:
        return {"status": 200, "patients": []}

    # Find users that look like patients
    uq = select(User).where(User.role_as == 5)
    if branch_id:
        uq = uq.where(User.branch_id == branch_id)

    users_result = await session.exec(uq)
    users = users_result.all() or []

    matched_user_ids = []
    for u in users:
        hay = " ".join(
            [
                (u.email or ""),
                (u.first_name or ""),
                (u.last_name or ""),
                (u.contact_number_mobile or ""),
                (u.nic_number or ""),
            ]
        ).lower()
        if q in hay:
            matched_user_ids.append(u.id)

    if not matched_user_ids:
        return {"status": 200, "patients": []}

    patients_result = await session.exec(select(Patient).where(col(Patient.user_id).in_(matched_user_ids)))
    pats = patients_result.all() or []

    out = []
    for p in pats:
        u = await session.get(User, p.user_id)
        if not u:
            continue
        out.append(
            {
                "id": p.id,
                "name": _full_name(u.first_name, u.last_name) or (u.email or ""),
                "phone": u.contact_number_mobile,
                "email": u.email,
                "dob": u.date_of_birth,
                "nic": u.nic_number,
            }
        )

    return {"status": 200, "patients": out[:25]}
