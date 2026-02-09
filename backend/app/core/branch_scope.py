"""
Branch-scope dependency — auto-filters queries for branch-scoped roles.

Usage:
    from app.core.branch_scope import get_branch_filter

    @router.get("/items")
    async def list_items(
        branch_id: Optional[str] = Depends(get_branch_filter),
        session: AsyncSession = Depends(get_session),
    ):
        query = select(Item)
        if branch_id:
            query = query.where(Item.branch_id == branch_id)
        ...
"""
from typing import Optional
from fastapi import Depends
from app.api.deps import get_current_user
from app.models.user import User


async def get_branch_filter(
    current_user: User = Depends(get_current_user),
) -> Optional[str]:
    """
    Returns branch_id if the user is scoped to a branch, else None.
    SuperAdmin (1) sees all branches — returns None.
    BranchAdmin (2) and other branch-scoped roles return their branch_id.
    """
    if current_user.role_as == 1:  # SuperAdmin — no filter
        return None
    return current_user.branch_id
