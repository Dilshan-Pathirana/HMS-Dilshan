
import asyncio
import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import get_session, async_engine
from sqlmodel import select, func
from app.models.patient_session import ScheduleSession
from app.models.doctor import Doctor
from app.models.user import User
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker

async def debug_query():
    print("Connecting to database...")
    async_session = sessionmaker(
        async_engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        print("Running query...")
        try:
            # Replicate the query from branch_admin.py
            q = (select(ScheduleSession, Doctor, User)
                 .join(Doctor, ScheduleSession.doctor_id == Doctor.id)
                 .join(User, Doctor.user_id == User.id))
            
            # Add a limit to be safe
            q = q.limit(5)
            
            results = await session.exec(q)
            rows = results.all()
            print(f"Query successful. Returned {len(rows)} rows.")
            for r in rows:
                print(r)
                
        except Exception as e:
            print("Query FAILED!")
            print(f"Error type: {type(e)}")
            print(f"Error message: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_query())
