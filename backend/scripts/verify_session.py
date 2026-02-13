import asyncio
import sys
import os

# Add the project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.config import settings
from app.models.patient_session import ScheduleSession
from app.models.doctor import Doctor
from app.models.doctor_schedule import DoctorSchedule
from sqlmodel import select
from datetime import date

DATABASE_URL = settings.DATABASE_URL
async_engine = create_async_engine(DATABASE_URL, echo=False, future=True)

async def verify_inputs():
    async_session = sessionmaker(
        bind=async_engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        print("Searching for doctor 'Anil Kumara'...")
        doctor_res = await session.exec(select(Doctor).where(Doctor.first_name == "Anil"))
        doctors = doctor_res.all()
        target_doctor = next((d for d in doctors if d.last_name == "Kumara"), None)
        
        if not target_doctor:
            print("Doctor not found.")
            return

        print(f"Doctor ID: {target_doctor.id}")

        # Check Schedule
        print("\nChecking Doctor Schedules:")
        schedules_res = await session.exec(select(DoctorSchedule).where(DoctorSchedule.doctor_id == target_doctor.id))
        schedules = schedules_res.all()
        for sched in schedules:
            print(f"  - Schedule ID: {sched.id}")
            print(f"    Day of Week: {sched.day_of_week} (0=Monday, 5=Saturday)")
            print(f"    Time: {sched.start_time} - {sched.end_time}")
            print(f"    Status: {sched.status}")
            print(f"    Recurrence: {sched.recurrence_type}")
            print(f"    Valid: {sched.valid_from} to {sched.valid_until}")
        
        # Check Session again
        target_date = date(2026, 2, 14) # Saturday
        print(f"\nChecking Sessions on {target_date}:")
        sessions_res = await session.exec(select(ScheduleSession).where(
            ScheduleSession.doctor_id == target_doctor.id,
            ScheduleSession.session_date == target_date
        ))
        sessions = sessions_res.all()
        if not sessions:
            print("  No sessions found.")
        else:
            for s in sessions:
                print(f"  Found Session: {s.id}, Status: {s.status}")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(verify_inputs())
