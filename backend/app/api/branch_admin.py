"""Branch Admin Dashboard & Management router – Patch 4.6

~15 endpoints: dashboard stats, request stats, feedback, EOD review,
notifications, branch staff management.
Uses existing models — no new tables needed.
"""
from __future__ import annotations

from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import select, func
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.api.deps import get_current_user

router = APIRouter()


# ──────────────────── Dashboard ────────────────────

@router.get("/dashboard-stats")
async def branch_admin_dashboard(
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    """Comprehensive dashboard for branch admin."""
    from app.models.user import User
    from app.models.appointment import Appointment
    from app.models.pos import BillingTransaction
    from app.models.hrm_leave import Leave

    branch_id = getattr(user, "branch_id", None)

    # Staff count
    staff_q = select(func.count(User.id)).where(User.is_active == True)  # noqa
    if branch_id:
        staff_q = staff_q.where(User.branch_id == branch_id)
    staff_count = (await session.exec(staff_q)).one() or 0

    # Today's appointments
    today_appts = (await session.exec(
        select(func.count(Appointment.id))
        .where(Appointment.appointment_date == date.today())
    )).one() or 0

    # Pending leaves
    pending_leaves = (await session.exec(
        select(func.count(Leave.id)).where(Leave.status == "pending")
    )).one() or 0

    # Today's revenue
    today_rev_q = select(
        func.coalesce(func.sum(BillingTransaction.net_amount), 0)
    ).where(
        BillingTransaction.status == "completed",
        func.date(BillingTransaction.created_at) == date.today(),
    )
    if branch_id:
        today_rev_q = today_rev_q.where(BillingTransaction.branch_id == branch_id)
    today_revenue = float((await session.exec(today_rev_q)).one() or 0)

    return {
        "staffCount": staff_count,
        "todayAppointments": today_appts,
        "pendingLeaves": pending_leaves,
        "todayRevenue": today_revenue,
    }


# ──────────────────── Request Stats ────────────────────

@router.get("/requests/stats")
async def request_stats(
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    from app.models.hrm_leave import Leave
    from app.models.hrm_policy import ServiceLetterRequest

    pending_leaves = (await session.exec(
        select(func.count(Leave.id)).where(Leave.status == "pending")
    )).one() or 0
    pending_sls = (await session.exec(
        select(func.count(ServiceLetterRequest.id)).where(ServiceLetterRequest.status == "pending")
    )).one() or 0

    return {
        "pendingLeaves": pending_leaves,
        "pendingServiceLetters": pending_sls,
    }


# ──────────────────── Feedback Management ────────────────────

@router.get("/feedbacks")
async def list_feedbacks(
    skip: int = 0, limit: int = 50,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    from app.models.patient_dashboard import Feedback
    result = await session.exec(
        select(Feedback).order_by(Feedback.created_at.desc()).offset(skip).limit(limit)  # type: ignore
    )
    return list(result.all())


@router.get("/feedbacks/stats")
async def feedback_stats(
    branch_id: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    """Stats endpoint used by SuperAdmin/BranchAdmin feedback dashboards."""
    from app.models.patient_dashboard import Feedback

    base_filters = []
    if branch_id and branch_id != "all":
        base_filters.append(Feedback.branch_id == branch_id)

    total_q = select(func.count(Feedback.id))
    if base_filters:
        total_q = total_q.where(*base_filters)
    total = (await session.exec(total_q)).one() or 0

    pending = (await session.exec(
        select(func.count(Feedback.id)).where(*(base_filters + [Feedback.status == "pending"]))
    )).one() or 0

    # Model uses: pending / reviewed / resolved
    in_review = (await session.exec(
        select(func.count(Feedback.id)).where(*(base_filters + [Feedback.status == "reviewed"]))
    )).one() or 0

    resolved = (await session.exec(
        select(func.count(Feedback.id)).where(*(base_filters + [Feedback.status == "resolved"]))
    )).one() or 0

    # Not present in current schema; keep for UI shape.
    responded = 0
    flagged = 0

    by_category_rows = await session.exec(
        select(Feedback.category, func.count(Feedback.id))
        .where(*base_filters) if base_filters else select(Feedback.category, func.count(Feedback.id))
        .group_by(Feedback.category)
    )
    by_category = {str(cat or "general"): int(cnt or 0) for cat, cnt in (by_category_rows.all() or [])}

    return {
        "status": 200,
        "stats": {
            "total": int(total),
            "pending": int(pending),
            "in_review": int(in_review),
            "responded": int(responded),
            "resolved": int(resolved),
            "flagged": int(flagged),
            "by_category": by_category,
            "by_user_type": {},
            "average_rating": 0,
        },
    }


@router.get("/feedbacks/{feedback_id}")
async def get_feedback(
    feedback_id: str,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    from app.models.patient_dashboard import Feedback
    f = await session.get(Feedback, feedback_id)
    if not f:
        raise HTTPException(404, "Feedback not found")
    return f


@router.put("/feedbacks/{feedback_id}/respond")
async def respond_feedback(
    feedback_id: str,
    response_text: str = Query(...),
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    from app.models.patient_dashboard import Feedback
    f = await session.get(Feedback, feedback_id)
    if not f:
        raise HTTPException(404, "Feedback not found")
    f.status = "responded"
    session.add(f)
    await session.commit()
    return {"detail": "Feedback responded"}


@router.delete("/feedbacks/{feedback_id}")
async def delete_feedback(
    feedback_id: str,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    from app.models.patient_dashboard import Feedback
    f = await session.get(Feedback, feedback_id)
    if not f:
        raise HTTPException(404, "Feedback not found")
    await session.delete(f)
    await session.commit()
    return {"detail": "Feedback deleted"}


# ──────────────────── EOD Report Review ────────────────────

@router.get("/requests/eod-reports")
async def list_eod_for_review(
    status: Optional[str] = None,
    skip: int = 0, limit: int = 50,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    from app.models.pos import EODReport
    branch_id = getattr(user, "branch_id", None)
    q = select(EODReport)
    if branch_id:
        q = q.where(EODReport.branch_id == branch_id)
    if status:
        q = q.where(EODReport.status == status)
    q = q.order_by(EODReport.created_at.desc()).offset(skip).limit(limit)  # type: ignore
    result = await session.exec(q)
    return list(result.all())


@router.get("/requests/eod-reports/{report_id}")
async def get_eod_for_review(
    report_id: str,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    from app.models.pos import EODReport
    r = await session.get(EODReport, report_id)
    if not r:
        raise HTTPException(404, "EOD report not found")
    return r


@router.put("/requests/eod-reports/{report_id}/approve")
async def approve_eod_report(
    report_id: str,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    from app.models.pos import EODReport
    r = await session.get(EODReport, report_id)
    if not r:
        raise HTTPException(404, "EOD report not found")
    r.status = "approved"
    session.add(r)
    await session.commit()
    return {"detail": "EOD report approved"}


@router.put("/requests/eod-reports/{report_id}/reject")
async def reject_eod_report(
    report_id: str,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    from app.models.pos import EODReport
    r = await session.get(EODReport, report_id)
    if not r:
        raise HTTPException(404, "EOD report not found")
    r.status = "rejected"
    session.add(r)
    await session.commit()
    return {"detail": "EOD report rejected"}


# ──────────────────── Branch Staff ────────────────────

@router.get("/staff")
async def list_branch_staff(
    branch_id: Optional[str] = None,
    role: Optional[int] = None,
    skip: int = 0, limit: int = 50,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    from app.models.user import User
    bid = branch_id or getattr(user, "branch_id", None)
    q = select(User).where(User.is_active == True)  # noqa
    if bid:
        q = q.where(User.branch_id == bid)
    if role is not None:
        q = q.where(User.role_as == role)
    q = q.offset(skip).limit(limit)
    result = await session.exec(q)
    return list(result.all())


@router.post("/staff/assign")
async def assign_staff_to_branch(
    user_id: str = Query(...),
    branch_id: str = Query(...),
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    from app.models.user import User
    u = await session.get(User, user_id)
    if not u:
        raise HTTPException(404, "User not found")
    u.branch_id = branch_id
    session.add(u)
    await session.commit()
    return {"detail": f"User {user_id} assigned to branch {branch_id}"}


@router.delete("/staff/{user_id}/unassign")
async def unassign_staff(
    user_id: str,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    from app.models.user import User
    u = await session.get(User, user_id)
    if not u:
        raise HTTPException(404, "User not found")
    u.branch_id = None
    session.add(u)
    await session.commit()
    return {"detail": "Staff unassigned from branch"}


# ──────────────────── Notifications (forwarding) ────────────────────

@router.get("/notifications/{user_id}")
async def branch_admin_notifications(
    user_id: str,
    skip: int = 0, limit: int = 50,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    from app.models.notification import Notification
    result = await session.exec(
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())  # type: ignore
        .offset(skip).limit(limit)
    )
    return list(result.all())


# ──────────────────── Doctor Sessions (Branch Admin View) ────────────────────

@router.get("/requests/doctor-schedules")
async def list_branch_doctor_sessions(
    branch_id: Optional[str] = None,
    doctor_id: Optional[str] = None,
    date: Optional[date] = None,
    skip: int = 0, limit: int = 50,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    """
    List dated sessions (occurrences) for the branch, including assigned nurses.
    Replaces the old 'schedules' endpoint which was 404.
    """
    from app.models.patient_session import ScheduleSession, SessionStaff
    from app.models.doctor import Doctor
    from app.models.user import User

    # Determine branch context
    bid = branch_id or getattr(user, "branch_id", None)
    
    # Base query: Sessions -> Doctor -> User
    q = (select(ScheduleSession, Doctor, User)
         .join(Doctor, ScheduleSession.doctor_id == Doctor.id)
         .join(User, Doctor.user_id == User.id))

    if bid:
        q = q.where(ScheduleSession.branch_id == bid)
    
    if doctor_id:
        q = q.where(ScheduleSession.doctor_id == doctor_id)
        
    if date:
        q = q.where(ScheduleSession.session_date == date)
        
    # Order by date desc, time asc
    q = q.order_by(ScheduleSession.session_date.desc(), ScheduleSession.start_time.asc())
    q = q.offset(skip).limit(limit)

    results = await session.exec(q)
    rows = results.all()

    # Post-process to get assigned nurses for these sessions
    session_ids = [r[0].id for r in rows]
    
    assigned_map = {}
    if session_ids:
        staff_q = (
            select(SessionStaff, User)
            .join(User, SessionStaff.staff_id == User.id)
            .where(SessionStaff.schedule_session_id.in_(session_ids))
            .where(SessionStaff.role == "nurse")
        )
        staff_res = await session.exec(staff_q)
        for ss, u in staff_res.all():
            if ss.schedule_session_id not in assigned_map:
                assigned_map[ss.schedule_session_id] = []
            assigned_map[ss.schedule_session_id].append({
                "id": u.id,
                "name": f"{u.first_name} {u.last_name}",
            })

    # Format response
    data = []
    for sched_session, doc, u in rows:
        data.append({
            "id": sched_session.id,
            "doctor_id": doc.id,
            "doctor_name": f"{doc.first_name} {doc.last_name}",
            "doctor_email": u.email,
            "doctor_specialization": doc.specialization,
            "branch_id": sched_session.branch_id,
            "session_date": sched_session.session_date,
            "start_time": sched_session.start_time,
            "end_time": sched_session.end_time,
            "status": sched_session.status,
            "assigned_nurses": assigned_map.get(sched_session.id, [])
        })

    return {
        "status": 200,
        "schedules": data
    }
