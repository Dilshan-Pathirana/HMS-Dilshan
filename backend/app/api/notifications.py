"""Notification router – Patch 3.3

12 endpoints for notification management.
"""
from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.api.deps import get_current_user
from app.models.notification import NotificationCreate, NotificationRead
from app.services.notification_service import NotificationService

router = APIRouter()
svc = NotificationService


@router.get("/", response_model=List[NotificationRead])
async def list_notifications(
    unread_only: bool = False,
    skip: int = 0, limit: int = 50,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    """Get current user's notifications."""
    return await svc.list_for_user(session, user.id, unread_only, skip, limit)


@router.get("/unread-count")
async def unread_count(
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    count = await svc.unread_count(session, user.id)
    return {"unread": count}


@router.get("/by-role", response_model=List[NotificationRead])
async def notifications_by_role(
    role: str = Query(...),
    skip: int = 0, limit: int = 50,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    return await svc.list_by_role(session, role, skip, limit)


@router.post("/", response_model=NotificationRead, status_code=201)
async def create_notification(
    body: NotificationCreate,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    return await svc.create(session, body.model_dump())


@router.put("/{notification_id}/read", response_model=NotificationRead)
async def mark_read(
    notification_id: str,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    return await svc.mark_read(session, notification_id, user.id)


@router.put("/read-all")
async def mark_all_read(
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    count = await svc.mark_all_read(session, user.id)
    return {"marked": count}


@router.delete("/clear-read")
async def clear_read(
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    count = await svc.clear_read(session, user.id)
    return {"cleared": count}


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    await svc.delete(session, notification_id, user.id)
    return {"detail": "Notification deleted"}


@router.get("/{notification_id}", response_model=NotificationRead)
async def get_notification(
    notification_id: str,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    from app.models.notification import Notification
    from fastapi import HTTPException
    n = await session.get(Notification, notification_id)
    if not n or n.user_id != user.id:
        raise HTTPException(404, "Notification not found")
    return n


@router.post("/broadcast")
async def broadcast_notification(
    title: str = Query(...),
    message: Optional[str] = None,
    role: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
):
    """Send notification to all users (or by role). Admin only."""
    from sqlmodel import select
    from app.models.user import User
    q = select(User)
    if role:
        q = q.where(User.role == role)
    result = await session.exec(q)
    users = list(result.all())
    count = 0
    for u in users:
        await svc.create(session, {
            "user_id": u.id, "role": u.role,
            "title": title, "message": message or "",
            "type": "info",
        })
        count += 1
    return {"sent": count}
