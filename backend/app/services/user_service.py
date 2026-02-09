"""
User Service — business logic for user CRUD.
"""
from typing import Optional
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.security import get_password_hash, verify_password
from app.models.user import User, UserCreate, UserUpdate


class UserService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, user_id: str) -> Optional[User]:
        return await self.session.get(User, user_id)

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self.session.exec(select(User).where(User.email == email))
        return result.first()

    async def create_user(self, user_in: UserCreate) -> User:
        existing = await self.get_by_email(user_in.email)
        if existing:
            raise ValueError("Email already registered")

        user = User.model_validate(user_in)
        user.hashed_password = get_password_hash(user_in.password)
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def update_user(self, user_id: str, user_in: UserUpdate) -> User:
        user = await self.get_by_id(user_id)
        if not user:
            raise ValueError("User not found")

        update_data = user_in.model_dump(exclude_unset=True)
        user.sqlmodel_update(update_data)
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def delete_user(self, user_id: str) -> bool:
        user = await self.get_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        await self.session.delete(user)
        await self.session.commit()
        return True

    async def change_password(self, user_id: str, current_password: str, new_password: str):
        user = await self.get_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        if not verify_password(current_password, user.hashed_password):
            raise ValueError("Current password is incorrect")
        user.hashed_password = get_password_hash(new_password)
        self.session.add(user)
        await self.session.commit()

    async def toggle_active(self, user_id: str, is_active: bool) -> User:
        user = await self.get_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        user.is_active = is_active
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def list_by_role(self, role_as: int, skip: int = 0, limit: int = 100):
        query = select(User).where(User.role_as == role_as).offset(skip).limit(limit)
        result = await self.session.exec(query)
        return result.all()
