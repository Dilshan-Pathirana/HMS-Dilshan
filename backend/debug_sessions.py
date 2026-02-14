
import asyncio
from sqlmodel import select, col
from app.core.database import async_session_maker
from app.models.doctor import Doctor
from app.models.branch import Branch
from app.models.doctor_schedule import DoctorSchedule
from app.models.patient_session import ScheduleSession
from app.models.appointment import Appointment
from datetime import date

async def main():
    async with async_session_maker() as session:
        # 1. Find the doctor
        print("--- Doctors ---")
        doctors = (await session.exec(select(Doctor))).all()
        target_doctor = None
        for d in doctors:
            full_name = f"{d.first_name} {d.last_name}"
            print(f"Doctor: {full_name} (ID: {d.id}) - Branch: {d.branch_id}")
            if "Doctor Branch 1" in full_name:
                target_doctor = d

        # 2. Find the branch
        print("\n--- Branches ---")
        branches = (await session.exec(select(Branch))).all()
        target_branch = None
        for b in branches:
            print(f"Branch: {b.center_name} (ID: {b.id})")
            if "Test Branch 1" in b.center_name:
                target_branch = b

        if not target_doctor or not target_branch:
            print("\nCould not identify target doctor or branch specifically.")
            # return

        # 3. Check Schedules
        print("\n--- Doctor Schedules ---")
        schedules = (await session.exec(select(DoctorSchedule))).all()
        for s in schedules:
            print(f"Schedule: DocID={s.doctor_id} BranchID={s.branch_id} Day={s.day_of_week} ({s.start_time}-{s.end_time}) Status={s.status}")

        # 4. Check Generated Sessions (ScheduleSession) for 2026-02-20
        target_date = date(2026, 2, 20)
        print(f"\n--- Schedule Sessions for {target_date} ---")
        q = select(ScheduleSession).where(ScheduleSession.session_date == target_date)
        sessions = (await session.exec(q)).all()
        if not sessions:
            print("No ScheduleSession found for this date.")
        for s in sessions:
            print(f"Session: ID={s.id} DocID={s.doctor_id} BranchID={s.branch_id} Status={s.status}")

        # 5. Check Appointments
        print(f"\n--- Appointments for {target_date} ---")
        q_appt = select(Appointment).where(Appointment.appointment_date == target_date)
        appts = (await session.exec(q_appt)).all()
        for a in appts:
            print(f"Appt: ID={a.id} DocID={a.doctor_id} SessionID={a.schedule_session_id} Status={a.status}")

if __name__ == "__main__":
    import sys
    import os
    # Add backend directory to sys.path so imports work
    current_dir = os.getcwd()
    sys.path.append(current_dir)
    
    asyncio.run(main())
