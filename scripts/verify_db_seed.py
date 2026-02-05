"""Quick script to verify database seeding"""
import asyncio
import sys
sys.path.insert(0, '/var/www/hms/current/backend')

from sqlmodel import select, func
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.database import async_engine
from app.models.user import User
from app.models.branch import Branch
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.appointment import Appointment
from app.models.visit import Visit, Queue

async def verify():
    async_session = sessionmaker(async_engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        # Count users
        result = await session.exec(select(func.count()).select_from(User))
        user_count = result.one()
        
        # Count branches
        result = await session.exec(select(func.count()).select_from(Branch))
        branch_count = result.one()
        
        # Count doctors
        result = await session.exec(select(func.count()).select_from(Doctor))
        doctor_count = result.one()
        
        # Count patients
        result = await session.exec(select(func.count()).select_from(Patient))
        patient_count = result.one()
        
        # Count appointments
        result = await session.exec(select(func.count()).select_from(Appointment))
        appointment_count = result.one()
        
        # Count visits
        result = await session.exec(select(func.count()).select_from(Visit))
        visit_count = result.one()
        
        # Count queue
        result = await session.exec(select(func.count()).select_from(Queue))
        queue_count = result.one()
        
        print("=" * 60)
        print("DATABASE SEEDING VERIFICATION")
        print("=" * 60)
        print(f"Users:        {user_count}")
        print(f"Branches:     {branch_count}")
        print(f"Doctors:      {doctor_count}")
        print(f"Patients:     {patient_count}")
        print(f"Appointments: {appointment_count}")
        print(f"Visits:       {visit_count}")
        print(f"Queue:        {queue_count}")
        print("=" * 60)
        
        # Show some sample users
        print("\nSample Users (first 5):")
        result = await session.exec(select(User).limit(5))
        users = result.all()
        for user in users:
            print(f"  - {user.email} | {user.username} | Role: {user.role_as}")
        
        print("\nBranches:")
        result = await session.exec(select(Branch))
        branches = result.all()
        for branch in branches:
            print(f"  - {branch.center_name}")
        
        print("\n✅ Verification complete!")

if __name__ == "__main__":
    try:
        asyncio.run(verify())
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
