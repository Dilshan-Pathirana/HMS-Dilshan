
import asyncio
import sys
import os

# Add the parent directory to sys.path to allow imports from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import select, func, col
from app.core.database import async_engine
from app.models.branch import Branch
from app.models.doctor import Doctor
from app.models.appointment import Appointment
from app.models.user import User
from app.models.doctor_branch_link import DoctorBranchLink
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession

async def main():
    async_session = sessionmaker(
        bind=async_engine, class_=AsyncSession, expire_on_commit=False
    )
    
    print("--- Debugging Super Admin Users ---")
    
    async with async_session() as session:
        # Check Users
        try:
            result = await session.exec(select(User).where(User.role_as == 1))
            users = result.all()
            print(f"\nSuper Admins Found: {len(users)}")
            for u in users:
                print(f"  - ID: {u.id}, Email: {u.email}, Username: {u.username}, IsActive: {u.is_active}")
        except Exception as e:
            print(f"Error fetching users: {e}")
            
        # Check Appointments
        try:
            result = await session.exec(select(Appointment).limit(10))
            appointments = result.all()
            print(f"\nAppointments (first 10):")
            for a in appointments:
                print(f"  - ID: {a.id}, Date: {a.appointment_date}, Status: {a.status}, BranchID: {a.branch_id}, DoctorID: {a.doctor_id}")
            
            # Count total
            count_res = await session.exec(select(func.count(Appointment.id)))
            total = count_res.one()
            print(f"Total Appointments: {total}")

            # Check Approintments by Date
            print("\n--- Appointments by Date & Status ---")
            appt_counts = await session.exec(
                select(Appointment.appointment_date, Appointment.status, func.count(Appointment.id))
                .group_by(Appointment.appointment_date, Appointment.status)
                .order_by(Appointment.appointment_date.desc())
            )
            for date_val, status, count in appt_counts.all():
                print(f"Date: {date_val}, Status: {status}, Count: {count}")
        except Exception as e:
             print(f"Error fetching appointments: {e}")

        # Check Doctor-Branch Links
        try:
            result = await session.exec(select(DoctorBranchLink))
            links = result.all()
            print(f"\nDoctor-Branch Links Found: {len(links)}")
            for l in links[:5]:
                print(f"  - DoctorID: {l.doctor_id} -> BranchID: {l.branch_id}")
        except Exception as e:
            print(f"Error fetching doctor-branch links: {e}")

if __name__ == "__main__":
    asyncio.run(main())
