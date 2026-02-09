"""
Branch Service — business logic for branch CRUD and staff management.
"""
from typing import Optional, List
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.branch import Branch, BranchCreate
from app.models.user import User


class BranchService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, branch_id: str) -> Optional[Branch]:
        return await self.session.get(Branch, branch_id)

    async def list_branches(self, skip: int = 0, limit: int = 100) -> List[Branch]:
        query = select(Branch).offset(skip).limit(limit)
        result = await self.session.exec(query)
        return result.all()

    async def create_branch(self, branch_data: dict) -> Branch:
        branch = Branch(**branch_data)
        self.session.add(branch)
        await self.session.commit()
        await self.session.refresh(branch)
        return branch

    async def update_branch(self, branch_id: str, update_data: dict) -> Branch:
        branch = await self.get_by_id(branch_id)
        if not branch:
            raise ValueError("Branch not found")
        branch.sqlmodel_update(update_data)
        self.session.add(branch)
        await self.session.commit()
        await self.session.refresh(branch)
        return branch

    async def delete_branch(self, branch_id: str) -> bool:
        branch = await self.get_by_id(branch_id)
        if not branch:
            raise ValueError("Branch not found")
        await self.session.delete(branch)
        await self.session.commit()
        return True

    async def assign_admin(self, branch_id: str, admin_user_id: str) -> Branch:
        branch = await self.get_by_id(branch_id)
        if not branch:
            raise ValueError("Branch not found")
        admin = await self.session.get(User, admin_user_id)
        if not admin:
            raise ValueError("Admin user not found")
        if admin.role_as != 2:
            raise ValueError("User is not a Branch Admin")
        branch.branch_admin_id = admin_user_id
        admin.branch_id = branch_id
        self.session.add(branch)
        self.session.add(admin)
        await self.session.commit()
        await self.session.refresh(branch)
        return branch

    async def assign_staff(self, branch_id: str, user_id: str) -> User:
        branch = await self.get_by_id(branch_id)
        if not branch:
            raise ValueError("Branch not found")
        user = await self.session.get(User, user_id)
        if not user:
            raise ValueError("User not found")
        user.branch_id = branch_id
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def get_staff(self, branch_id: str) -> List[User]:
        query = select(User).where(User.branch_id == branch_id)
        result = await self.session.exec(query)
        return result.all()

    async def get_details(self, branch_id: str) -> dict:
        branch = await self.get_by_id(branch_id)
        if not branch:
            raise ValueError("Branch not found")
        staff = await self.get_staff(branch_id)
        return {
            "branch": branch,
            "staff_count": len(staff),
            "staff": staff,
        }
