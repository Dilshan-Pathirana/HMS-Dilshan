
import asyncio
from sqlalchemy import text
from app.core.database import async_engine
from app.models.appointment import Appointment
from sqlmodel import select
from app.core.database import get_session

async def check_appointments():
    async with async_engine.connect() as conn:
        result = await conn.execute(text("SELECT count(*) FROM appointment"))
        count = result.scalar()
        print(f"Total appointments in DB (raw SQL): {count}")

    # Test the ORM query logic
    async for session in get_session():
        query = select(Appointment)
        result = await session.exec(query)
        appointments = result.all()
        print(f"Total appointments in DB (ORM): {len(appointments)}")
        
        if appointments:
            print("First appointment:", appointments[0])

if __name__ == "__main__":
    asyncio.run(check_appointments())
