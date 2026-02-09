"""
Role-based permission checker.

Usage:
    from app.core.permissions import require_roles

    @router.delete("/users/{user_id}")
    async def delete_user(
        user_id: str,
        current_user: User = Depends(require_roles(1, 2)),  # SuperAdmin or BranchAdmin
        session: AsyncSession = Depends(get_session),
    ):
        ...
"""
from typing import List
from fastapi import Depends, HTTPException, status
from app.api.deps import get_current_user
from app.models.user import User


# Canonical role mapping
ROLES = {
    1: "super_admin",
    2: "branch_admin",
    3: "doctor",
    4: "nurse",
    5: "patient",
    6: "cashier",
    7: "pharmacist",
    8: "it_support",
    9: "center_aid",
    10: "auditor",
}


def require_roles(*allowed_role_ids: int):
    """
    FastAPI dependency that restricts access to specific roles.
    Returns the current_user if authorized, raises 403 otherwise.

    Example: Depends(require_roles(1, 2))
    """
    async def _checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role_as not in allowed_role_ids:
            allowed_names = [ROLES.get(r, str(r)) for r in allowed_role_ids]
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role(s): {', '.join(allowed_names)}",
            )
        return current_user
    return _checker


def role_name(role_as: int) -> str:
    """Get human-readable role name from role_as integer."""
    return ROLES.get(role_as, "unknown")
