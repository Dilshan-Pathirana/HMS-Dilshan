from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlmodel import select, func, col
from sqlmodel.ext.asyncio.session import AsyncSession
from datetime import date

from app.core.database import get_session
from app.api.deps import get_current_active_superuser
from app.models.user import User
from app.models.branch import Branch
from app.models.patient import Patient
from app.models.appointment import Appointment
# from app.models.payment import Payment # Assuming payment model exists or will be calculated differently

router = APIRouter()

@router.get("/dashboard-stats", response_model=Dict[str, Any])
async def get_dashboard_stats(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser),
):
    """
    Get aggregated dashboard statistics for Super Admin.
    """
    today = date.today()

    # 1. Total Users
    total_users_result = await session.exec(select(func.count(User.id)))
    total_users = total_users_result.one()

    # 2. Total Branches
    total_branches_result = await session.exec(select(func.count(Branch.id)))
    total_branches = total_branches_result.one()

    # 3. Total Patients
    total_patients_result = await session.exec(select(func.count(Patient.id)))
    total_patients = total_patients_result.one()

    # 4. Today's Appointments
    today_appointments_result = await session.exec(select(func.count(Appointment.id)).where(Appointment.appointment_date == today))
    today_appointments = today_appointments_result.one()

    # 5. Active Staff (Users who are active and not patients)
    # Assuming role_as 0 is generic user/patient, others are specific roles. 
    # Or just check is_active=True
    active_staff_result = await session.exec(select(func.count(User.id)).where(User.is_active == True))
    active_staff = active_staff_result.one()

    # 6. Monthly Revenue (Placeholder)
    # If Payment model exists:
    # monthly_revenue = await session.exec(select(func.sum(Payment.amount)).where(...))
    monthly_revenue = 0 # Placeholder

    return {
        "status": 200, # Frontend expects response.data.status === 200
        "data": {
            "totalUsers": total_users,
            "totalBranches": total_branches,
            "totalPatients": total_patients,
            "todayAppointments": today_appointments,
            "monthlyRevenue": monthly_revenue,
            "activeStaff": active_staff
        }
    }


@router.post("/seed-defaults")
async def seed_defaults(
    session: AsyncSession = Depends(get_session),
    # verifying_user: User = Depends(get_current_active_superuser), # Ideally we want this, but if no user exists, we can't login!
    # So we must leave this open or use a secret header.
    # For now, we'll check if ANY super admin exists. If so, return 400.
):
    from app.core.security import get_password_hash
    
    # Check if super admin exists
    result = await session.exec(select(User).where(User.email == "admin@hospital.com"))
    existing = result.first()
    if existing:
        return {"status": 400, "message": "Super admin already exists"}

    # Create Super Admin
    # Replicating logic from seed.py
    ADMIN_EMAIL = "admin@hospital.com"
    ADMIN_USERNAME = "super admin"
    ADMIN_ROLE = 1
    ADMIN_PASSWORD = "Test@123"

    new_admin = User(
        email=ADMIN_EMAIL,
        username=ADMIN_USERNAME,
        hashed_password=get_password_hash(ADMIN_PASSWORD),
        role_as=ADMIN_ROLE,
        is_active=True,
    )
    session.add(new_admin)
    await session.commit()
    
    return {"status": 200, "message": f"Seeded super admin: {ADMIN_EMAIL}"}
