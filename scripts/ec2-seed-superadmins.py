import asyncio
from sqlmodel import select
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import async_engine as engine
from app.core.security import get_password_hash
from app.models.user import User

USERS = [
    {"email": "admin@hospital.com", "username": "Super Admin"},
    {"email": "wilderman.dashawn@example.net", "username": "Leora Bernhard Elisa Lueilwitz"},
    {"email": "asd@gmail.com", "username": "test01 qweqwe [IT Assistant]"},
    {"email": "asdf@sd.com", "username": "sdfg xcvb [Audiologist]"},
    {"email": "sample@coun.com", "username": "sample c counceler 01 [Counselor]"},
    {"email": "dfg@wer.co", "username": "dfghj fghjk [Therapist]"},
]

DEFAULT_PASSWORD = "Test@123"
ROLE_SUPERADMIN = 1


async def main() -> None:
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        for user in USERS:
            result = await session.exec(select(User).where(User.email == user["email"]))
            exists = result.first()
            if not exists:
                new_user = User(
                    email=user["email"],
                    username=user["username"],
                    hashed_password=get_password_hash(DEFAULT_PASSWORD),
                    role_as=ROLE_SUPERADMIN,
                    is_active=True,
                )
                session.add(new_user)
        await session.commit()


if __name__ == "__main__":
    asyncio.run(main())
