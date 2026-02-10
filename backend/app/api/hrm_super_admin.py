"""HRM Super Admin compatibility endpoints.

The frontend HRM module calls `/api/v1/hrm/super-admin/*` endpoints with
specific response wrappers (e.g. `{status: 200, ...}` or `{data: ...}`).

Core HRM routers (`hrm_admin`, `hrm_leave`, `hrm_salary`, `hrm_shift`) expose
more generic endpoints under `/api/v1/hrm/*`. This module provides the
missing super-admin routes and returns safe defaults to avoid 404s.
"""

from __future__ import annotations

import calendar
from datetime import date
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Body, Depends, Query
from sqlmodel import func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_session
from app.models.branch import Branch
from app.models.hrm_leave import Leave, LeaveType, LeaveTypeCreate
from app.models.hrm_policy import HRPolicy, HRPolicyCreate
from app.models.user import User

router = APIRouter()


def _month_name(yyyy_mm: str) -> str:
    try:
        year_s, month_s = yyyy_mm.split("-", 1)
        month_i = int(month_s)
        year_i = int(year_s)
        return f"{calendar.month_name[month_i]} {year_i}"
    except Exception:
        return yyyy_mm


async def _list_branches(session: AsyncSession) -> List[Dict[str, str]]:
    result = await session.exec(select(Branch).order_by(Branch.center_name))
    return [{"id": b.id, "center_name": b.center_name} for b in result.all()]


# ───────────────────────── Dashboard / Stats ─────────────────────────


@router.get("/stats")
async def get_hrm_stats(
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    # Basic stats (safe defaults if tables are empty)
    total_staff_res = await session.exec(
        select(func.count(User.id)).where(User.role_as != 5)  # 5=Patient
    )
    total_staff = int(total_staff_res.one() or 0)

    active_staff_res = await session.exec(
        select(func.count(User.id)).where(User.role_as != 5, User.is_active == True)  # noqa
    )
    active_staff = int(active_staff_res.one() or 0)

    pending_leaves_res = await session.exec(
        select(func.count(Leave.id)).where(Leave.status == "pending")
    )
    pending_leaves = int(pending_leaves_res.one() or 0)

    branches = await session.exec(select(Branch))
    branch_list = list(branches.all())

    branch_overview: List[Dict[str, Any]] = []
    for b in branch_list:
        staff_count_res = await session.exec(
            select(func.count(User.id)).where(User.branch_id == b.id, User.role_as != 5)
        )
        branch_overview.append(
            {
                "id": b.id,
                "branch_name": b.center_name,
                "staff_count": int(staff_count_res.one() or 0),
            }
        )

    return {
        "status": 200,
        "stats": {
            "totalStaff": total_staff,
            "activeStaff": active_staff,
            "totalPayroll": 0,
            "pendingLeaves": pending_leaves,
            "overtime": {"hours": 0, "amount": 0},
            "epfEtf": {
                "epfEmployee": 0,
                "epfEmployer": 0,
                "etfEmployer": 0,
                "totalContributions": 0,
            },
            "branchOverview": branch_overview,
        },
    }


# ───────────────────────── Branches helper ─────────────────────────


@router.get("/salary-structures/branches")
async def salary_structure_branches(
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    return {"status": 200, "branches": await _list_branches(session)}


# ───────────────────────── Salary Structures (stub) ─────────────────────────


@router.get("/salary-structures")
async def list_salary_structures(
    branch_id: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    # No backing table in this repo yet — return safe empty list.
    return {"status": 200, "structures": []}


@router.get("/salary-structures/stats")
async def salary_structures_stats(
    branch_id: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    return {
        "status": 200,
        "stats": {
            "total": 0,
            "active": 0,
            "inactive": 0,
            "avg_min_salary": 0,
            "avg_max_salary": 0,
            "highest_grade": None,
            "lowest_grade": None,
        },
    }


@router.post("/salary-structures")
async def create_salary_structure(
    payload: Dict[str, Any] = Body(default={}),
    user: User = Depends(get_current_user),
):
    # Stub create
    return {"status": 201, "structure": {**payload, "id": "stub"}}


@router.put("/salary-structures/{structure_id}")
async def update_salary_structure(
    structure_id: str,
    payload: Dict[str, Any] = Body(default={}),
    user: User = Depends(get_current_user),
):
    return {"status": 200, "structure": {**payload, "id": structure_id}}


@router.delete("/salary-structures/{structure_id}")
async def delete_salary_structure(
    structure_id: str,
    user: User = Depends(get_current_user),
):
    return {"status": 200, "message": "Salary structure deleted (stub)"}


@router.post("/salary-structures/copy-to-branch")
async def copy_salary_structures_to_branch(
    payload: Dict[str, Any] = Body(default={}),
    user: User = Depends(get_current_user),
):
    return {"status": 200, "message": "Copied to branch (stub)"}


# ───────────────────────── Policies (DB-backed) ─────────────────────────


@router.get("/policies")
async def list_policies(
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    q = select(HRPolicy).where(HRPolicy.is_active == True)  # noqa
    if category:
        q = q.where(HRPolicy.category == category)
    q = q.order_by(HRPolicy.created_at.desc()).offset(skip).limit(limit)  # type: ignore
    result = await session.exec(q)
    return {"status": 200, "policies": list(result.all())}


@router.get("/policies/stats")
async def policies_stats(
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    total_res = await session.exec(select(func.count(HRPolicy.id)))
    active_res = await session.exec(select(func.count(HRPolicy.id)).where(HRPolicy.is_active == True))  # noqa
    return {
        "status": 200,
        "stats": {
            "total": int(total_res.one() or 0),
            "active": int(active_res.one() or 0),
            "inactive": 0,
            "by_category": [],
            "recent_updates": [],
        },
    }


@router.post("/policies")
async def create_policy(
    body: HRPolicyCreate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    p = HRPolicy(**body.model_dump())
    session.add(p)
    await session.commit()
    await session.refresh(p)
    return {"status": 201, "policy": p}


@router.put("/policies/{policy_id}")
async def update_policy(
    policy_id: str,
    body: HRPolicyCreate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    p = await session.get(HRPolicy, policy_id)
    if not p:
        return {"status": 404, "message": "Policy not found"}
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(p, k, v)
    session.add(p)
    await session.commit()
    await session.refresh(p)
    return {"status": 200, "policy": p}


@router.delete("/policies/{policy_id}")
async def delete_policy(
    policy_id: str,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    p = await session.get(HRPolicy, policy_id)
    if not p:
        return {"status": 404, "message": "Policy not found"}
    p.is_active = False
    session.add(p)
    await session.commit()
    return {"status": 200, "message": "Policy deleted"}


@router.post("/policies/copy-to-branch")
async def copy_policies_to_branch(
    payload: Dict[str, Any] = Body(default={}),
    user: User = Depends(get_current_user),
):
    return {"status": 200, "message": "Copied to branch (stub)"}


# ───────────────────────── EPF/ETF config (alias) ─────────────────────────


@router.get("/epf-etf-config")
async def get_epf_etf_config(
    user: User = Depends(get_current_user),
):
    return {
        "status": 200,
        "config": {
            "epf_employee_rate": 8.0,
            "epf_employer_rate": 12.0,
            "etf_rate": 3.0,
        },
    }


@router.post("/epf-etf-config")
async def update_epf_etf_config(
    payload: Dict[str, Any] = Body(default={}),
    user: User = Depends(get_current_user),
):
    return {"status": 200, "message": "Config updated (stub)", "config": payload}


# ───────────────────────── Leave Types (DB-backed with wrapper) ─────────────────────────


@router.get("/leave-types")
async def list_leave_types(
    branch_id: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    result = await session.exec(select(LeaveType).where(LeaveType.is_active == True))  # noqa
    return {"status": 200, "leaveTypes": list(result.all())}


@router.post("/leave-types")
async def create_leave_type(
    body: LeaveTypeCreate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    lt = LeaveType(**body.model_dump())
    session.add(lt)
    await session.commit()
    await session.refresh(lt)
    return {"status": 201, "leaveType": lt}


@router.put("/leave-types/{lt_id}")
async def update_leave_type(
    lt_id: str,
    body: LeaveTypeCreate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    lt = await session.get(LeaveType, lt_id)
    if not lt:
        return {"status": 404, "message": "Leave type not found"}
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(lt, k, v)
    session.add(lt)
    await session.commit()
    await session.refresh(lt)
    return {"status": 200, "leaveType": lt}


@router.delete("/leave-types/{lt_id}")
async def delete_leave_type(
    lt_id: str,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    lt = await session.get(LeaveType, lt_id)
    if not lt:
        return {"status": 404, "message": "Leave type not found"}
    lt.is_active = False
    session.add(lt)
    await session.commit()
    return {"status": 200, "message": "Leave type deleted"}


@router.post("/leave-types/initialize")
async def initialize_leave_types(
    user: User = Depends(get_current_user),
):
    # Stub: frontend expects 201 sometimes.
    return {"status": 201, "message": "Initialized (stub)"}


@router.post("/leave-types/copy-to-branch")
async def copy_leave_types_to_branch(
    payload: Dict[str, Any] = Body(default={}),
    user: User = Depends(get_current_user),
):
    return {"status": 200, "message": "Copied to branch (stub)"}


# ───────────────────────── Shift Templates (stub) ─────────────────────────


@router.get("/shift-templates")
async def list_shift_templates(
    branch_id: Optional[str] = None,
    user: User = Depends(get_current_user),
):
    return {"status": 200, "templates": []}


@router.post("/shift-templates")
async def create_shift_template(
    payload: Dict[str, Any] = Body(default={}),
    user: User = Depends(get_current_user),
):
    return {"status": 201, "template": {**payload, "id": "stub"}}


@router.put("/shift-templates/{template_id}")
async def update_shift_template(
    template_id: str,
    payload: Dict[str, Any] = Body(default={}),
    user: User = Depends(get_current_user),
):
    return {"status": 200, "template": {**payload, "id": template_id}}


@router.delete("/shift-templates/{template_id}")
async def delete_shift_template(
    template_id: str,
    user: User = Depends(get_current_user),
):
    return {"status": 200, "message": "Shift template deleted (stub)"}


@router.post("/shift-templates/initialize")
async def initialize_shift_templates(
    payload: Dict[str, Any] = Body(default={}),
    user: User = Depends(get_current_user),
):
    return {"status": 200, "message": "Initialized (stub)"}


@router.post("/shift-templates/copy-to-branch")
async def copy_shift_templates_to_branch(
    payload: Dict[str, Any] = Body(default={}),
    user: User = Depends(get_current_user),
):
    return {"status": 200, "message": "Copied to branch (stub)"}


# ───────────────────────── Payroll Config (stub) ─────────────────────────


@router.get("/payroll-config")
async def get_payroll_config(
    branch_id: Optional[str] = None,
    user: User = Depends(get_current_user),
):
    return {"status": 200, "config": None}


@router.post("/payroll-config")
async def save_payroll_config(
    payload: Dict[str, Any] = Body(default={}),
    user: User = Depends(get_current_user),
):
    return {"status": 200, "message": "Saved (stub)", "config": payload}


@router.post("/payroll-config/reset")
async def reset_payroll_config(
    payload: Dict[str, Any] = Body(default={}),
    user: User = Depends(get_current_user),
):
    return {"status": 200, "message": "Reset (stub)"}


@router.post("/payroll-config/copy-to-branch")
async def copy_payroll_config_to_branch(
    payload: Dict[str, Any] = Body(default={}),
    user: User = Depends(get_current_user),
):
    return {"status": 200, "message": "Copied to branch (stub)"}


@router.post("/payroll-config/calculate")
async def calculate_payroll_config(
    payload: Dict[str, Any] = Body(default={}),
    user: User = Depends(get_current_user),
):
    return {"status": 200, "result": {}}


# ───────────────────────── Payroll Management (stub wrapper) ─────────────────────────


@router.get("/payroll")
async def get_payroll(
    month: str = Query(default_factory=lambda: date.today().strftime("%Y-%m")),
    branch_id: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    month_name = _month_name(month)
    summary = {
        "staffCount": 0,
        "totalBasic": 0,
        "totalAllowances": 0,
        "totalOvertime": 0,
        "totalGross": 0,
        "totalEPFEmployee": 0,
        "totalEPFEmployer": 0,
        "totalETFEmployer": 0,
        "totalDeductions": 0,
        "totalNet": 0,
        "totalEmployerCost": 0,
    }
    return {
        "status": 200,
        "payroll": {
            "month": month,
            "monthName": month_name,
            "summary": summary,
            "staff": [],
        },
    }


@router.post("/generate-payslips")
async def generate_payslips(
    payload: Dict[str, Any] = Body(default={}),
    user: User = Depends(get_current_user),
):
    return {"status": 200, "message": "Payslips generated (stub)"}


# ───────────────────────── Analytics (safe defaults) ─────────────────────────


@router.get("/analytics/dashboard")
async def analytics_dashboard(
    branch_id: Optional[str] = None,
    user: User = Depends(get_current_user),
):
    return {
        "data": {
            "workforce": {"total_staff": 0, "total_payroll": 0},
            "statutory": {"epf_employee": 0, "epf_employer": 0, "etf_employer": 0, "total": 0},
            "pending_actions": {
                "leave_requests": 0,
                "salary_increments": 0,
                "letter_requests": 0,
                "open_complaints": 0,
            },
        }
    }


@router.get("/analytics/workforce")
async def analytics_workforce(
    branch_id: Optional[str] = None,
    user: User = Depends(get_current_user),
):
    return {
        "data": {
            "total_staff": 0,
            "by_role": [],
            "by_employment_type": [],
            "by_branch": [],
            "new_hires_this_month": 0,
            "tenure_distribution": {
                "less_than_1_year": 0,
                "1_to_3_years": 0,
                "3_to_5_years": 0,
                "more_than_5_years": 0,
            },
            "epf_coverage": {"enabled": 0, "percentage": 0},
        }
    }


@router.get("/analytics/payroll")
async def analytics_payroll(
    year: Optional[int] = None,
    branch_id: Optional[str] = None,
    user: User = Depends(get_current_user),
):
    return {
        "data": {
            "total_monthly_payroll": 0,
            "statutory_contributions": {"epf_employee": 0, "epf_employer": 0, "etf_employer": 0, "total": 0},
            "salary_distribution": {"below_50k": 0, "50k_to_100k": 0, "100k_to_150k": 0, "above_150k": 0},
            "by_branch": [],
            "avg_salary_by_role": [],
        }
    }


@router.get("/analytics/leave")
async def analytics_leave(
    year: Optional[int] = None,
    branch_id: Optional[str] = None,
    user: User = Depends(get_current_user),
):
    yr = str(year or date.today().year)
    return {
        "data": {
            "year": yr,
            "by_type": [],
            "by_month": [],
            "pending_count": 0,
            "approval_rate": 0,
            "avg_processing_days": 0,
        }
    }


@router.get("/analytics/turnover")
async def analytics_turnover(
    year: Optional[int] = None,
    branch_id: Optional[str] = None,
    user: User = Depends(get_current_user),
):
    yr = str(year or date.today().year)
    return {
        "data": {
            "year": yr,
            "new_hires": 0,
            "terminations": 0,
            "current_headcount": 0,
            "turnover_rate": 0,
            "hires_by_month": [],
        }
    }


@router.get("/analytics/attendance")
async def analytics_attendance(
    month: str,
    branch_id: Optional[str] = None,
    user: User = Depends(get_current_user),
):
    return {
        "data": {
            "month": month,
            "summary": [],
            "average_work_hours": 0,
            "late_arrivals": 0,
            "total_overtime_hours": 0,
            "daily_trend": [],
            "message": "No attendance data available",
        }
    }


@router.get("/analytics/overtime")
async def analytics_overtime(
    month: str,
    branch_id: Optional[str] = None,
    user: User = Depends(get_current_user),
):
    return {
        "data": {
            "month": month,
            "total_ot_hours": 0,
            "estimated_ot_cost": 0,
            "by_role": [],
            "top_earners": [],
            "daily_trend": [],
            "message": "No overtime data available",
        }
    }


# ───────────────────────── Audit Logs (stub wrapper) ─────────────────────────


@router.get("/audit-logs")
async def audit_logs(
    page: int = 1,
    per_page: int = 20,
    search: Optional[str] = None,
    action_type: Optional[str] = None,
    entity_type: Optional[str] = None,
    branch_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user: User = Depends(get_current_user),
):
    return {
        "status": "success",
        "data": [],
        "meta": {"current_page": page, "last_page": 1, "per_page": per_page, "total": 0},
    }


@router.get("/audit-logs/filters")
async def audit_log_filters(
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    return {
        "status": "success",
        "data": {
            "action_types": [],
            "entity_types": [],
            "users": [],
            "branches": await _list_branches(session),
            "action_type_labels": {},
            "entity_type_labels": {},
        },
    }


@router.get("/audit-logs/stats")
async def audit_log_stats(
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    return {
        "status": "success",
        "data": {
            "total_logs": 0,
            "today_count": 0,
            "this_week_count": 0,
            "this_month_count": 0,
            "by_action_type": [],
            "by_entity_type": [],
            "by_branch": [],
            "recent_activity": [],
            "top_users": [],
        },
    }
