
import asyncio
import logging
from datetime import date, time, datetime
from uuid import uuid4

from sqlmodel import select
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import async_engine
from app.models.branch import Branch
from app.models.user import User
from app.models.doctor import Doctor
from app.models.doctor_schedule import DoctorSchedule
from app.models.patient_session import ScheduleSession

# Suppress logging
logging.basicConfig(level=logging.WARN)
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARN)

async def test_auto_gen():
    async_session = sessionmaker(
        async_engine, class_=AsyncSession, expire_on_commit=False
    )
    
    branch_id = str(uuid4())
    user_id = str(uuid4())
    doctor_id = str(uuid4())
    schedule_id = str(uuid4())
    
    today = date.today()
    day_of_week = today.weekday()

    async with async_session() as session:
        print("Setting up test data (Schedule ONLY, No Session)...")
        
        # 1. Branch
        branch = Branch(id=branch_id, center_name="Auto Gen Branch", status="active")
        session.add(branch)

        # 2. User & Doctor
        user = User(id=user_id, email=f"autogen_{uuid4()}@test.com", first_name="Auto", last_name="Gen", password_hash="hash", role_as=3, branch_id=branch_id)
        session.add(user)
        
        doctor = Doctor(id=doctor_id, user_id=user_id, specialization="Test", status="active", joining_date=today)
        session.add(doctor)
        
        # 3. Schedule for TODAY
        schedule = DoctorSchedule(
            id=schedule_id,
            doctor_id=doctor_id,
            branch_id=branch_id,
            day_of_week=day_of_week,
            start_time=time(10, 0),
            end_time=time(12, 0),
            status="active"
        )
        session.add(schedule)
        
        await session.commit()
        print("Test data created.")

        # --- LOGIC FROM branch_admin.py ---
        print("Running auto-generation logic...")
        bid = branch_id
        target_date = today
        
        if bid and target_date >= date.today():
            try:
                # Find active schedules
                sched_q = select(DoctorSchedule).where(
                    DoctorSchedule.branch_id == bid,
                    DoctorSchedule.day_of_week == day_of_week,
                    DoctorSchedule.status == "active"
                )
                schedules = (await session.exec(sched_q)).all()
                print(f"Found {len(schedules)} active schedules.")
                
                # Check existing sessions
                existing_sessions_q = select(ScheduleSession.schedule_id).where(
                    ScheduleSession.branch_id == bid,
                    ScheduleSession.session_date == target_date
                )
                existing_schedule_ids = (await session.exec(existing_sessions_q)).all()
                existing_ids_set = set(existing_schedule_ids)
                
                new_sessions = []
                for sched in schedules:
                    if sched.id in existing_ids_set:
                        continue
                    
                    print(f"Creating session for schedule {sched.id}")
                    new_session = ScheduleSession(
                        schedule_id=sched.id,
                        doctor_id=sched.doctor_id,
                        branch_id=bid,
                        session_date=target_date,
                        start_time=sched.start_time,
                        end_time=sched.end_time,
                        status="active",
                        session_key=f"{sched.doctor_id}_{target_date}_{sched.start_time}"
                    )
                    new_sessions.append(new_session)
                
                if new_sessions:
                    for ns in new_sessions:
                        session.add(ns)
                    await session.commit()
                    print(f"Committed {len(new_sessions)} new sessions.")
            except Exception as e:
                print(f"Error: {e}")
        # ----------------------------------

        # Verify creation
        verify_q = select(ScheduleSession).where(ScheduleSession.branch_id == branch_id)
        sessions = (await session.exec(verify_q)).all()
        
        if len(sessions) == 1:
            print("SUCCESS: Session was auto-generated!")
            print(f"Session ID: {sessions[0].id}")
        else:
            print(f"FAILURE: Expected 1 session, found {len(sessions)}")

if __name__ == "__main__":
    import sys
    import os
    sys.path.append(os.path.join(os.getcwd(), 'backend'))
    asyncio.run(test_auto_gen())
