import asyncio

from sqlalchemy.orm import sessionmaker
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import async_engine as engine
from app.core.security import get_password_hash
from app.models.user import User


ADMIN_EMAIL = "admin@hospital.com"
ADMIN_USERNAME = "super admin"
ADMIN_ROLE = 1
ADMIN_PASSWORD = "Test@123"


async def main() -> None:
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        result = await session.exec(select(User).where(User.email == ADMIN_EMAIL))
        existing = result.first()
        if existing:
            print(f"Super admin already exists: {ADMIN_EMAIL}")
            return

        session.add(
            User(
                email=ADMIN_EMAIL,
                username=ADMIN_USERNAME,
                hashed_password=get_password_hash(ADMIN_PASSWORD),
                role_as=ADMIN_ROLE,
                is_active=True,
            )
        )
        await session.commit()
        print(f"Seeded super admin: {ADMIN_EMAIL}")


if __name__ == "__main__":
    asyncio.run(main())
