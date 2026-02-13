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

async def fix_session():
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

        target_date = date(2026, 2, 14)
        print(f"Target Date: {target_date}")

        # Check for existing session first to avoid duplicates
        existing_res = await session.exec(select(ScheduleSession).where(
            ScheduleSession.doctor_id == target_doctor.id,
            ScheduleSession.session_date == target_date
        ))
        if existing_res.first():
            print("Session already exists! No action needed.")
            return

        # Find matching schedule
        day_of_week = target_date.weekday() # 5 for Saturday
        print(f"Looking for schedule on day {day_of_week}...")
        
        schedules_res = await session.exec(select(DoctorSchedule).where(
            DoctorSchedule.doctor_id == target_doctor.id,
            DoctorSchedule.day_of_week == day_of_week,
            DoctorSchedule.status == "active"
        ))
        schedules = schedules_res.all()
        
        # Simple filter for validity (ignoring advanced biweekly logic for now as verification showed weekly)
        valid_schedule = None
        for s in schedules:
            if s.valid_from and s.valid_from > target_date:
                continue
            if s.valid_until and s.valid_until < target_date:
                continue
            valid_schedule = s
            break
        
        if not valid_schedule:
            print("No valid schedule found for this date.")
            return
            
        print(f"Found valid schedule: {valid_schedule.id}")
        
        # Create Session
        session_key = f"{valid_schedule.id}:{target_date.isoformat()}"
        print(f"Creating session with key: {session_key}")
        
        new_session = ScheduleSession(
            schedule_id=valid_schedule.id,
            doctor_id=target_doctor.id,
            branch_id=valid_schedule.branch_id,
            session_date=target_date,
            start_time=valid_schedule.start_time,
            end_time=valid_schedule.end_time,
            status="active",
            session_key=session_key
        )
        
        session.add(new_session)
        await session.commit()
        await session.refresh(new_session)
        print(f"Successfully created session: {new_session.id}")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(fix_session())
