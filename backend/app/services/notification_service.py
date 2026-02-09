"""Notification service – Patch 3.3"""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from fastapi import HTTPException
from sqlmodel import select, func
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.notification import Notification


class NotificationService:

    @staticmethod
    async def create(session: AsyncSession, data: dict) -> Notification:
        n = Notification(**data)
        session.add(n)
        await session.commit()
        await session.refresh(n)
        return n

    @staticmethod
    async def list_for_user(session: AsyncSession, user_id: str,
                            unread_only: bool = False,
                            skip: int = 0, limit: int = 50) -> List[Notification]:
        q = select(Notification).where(Notification.user_id == user_id)
        if unread_only:
            q = q.where(Notification.is_read == False)  # noqa
        q = q.order_by(Notification.created_at.desc()).offset(skip).limit(limit)  # type: ignore
        result = await session.exec(q)
        return list(result.all())

    @staticmethod
    async def list_by_role(session: AsyncSession, role: str,
                           skip: int = 0, limit: int = 50) -> List[Notification]:
        result = await session.exec(
            select(Notification)
            .where(Notification.role == role)
            .order_by(Notification.created_at.desc())  # type: ignore
            .offset(skip).limit(limit)
        )
        return list(result.all())

    @staticmethod
    async def unread_count(session: AsyncSession, user_id: str) -> int:
        result = await session.exec(
            select(func.count(Notification.id))
            .where(Notification.user_id == user_id, Notification.is_read == False)  # noqa
        )
        return result.one() or 0

    @staticmethod
    async def mark_read(session: AsyncSession, notification_id: str, user_id: str) -> Notification:
        n = await session.get(Notification, notification_id)
        if not n or n.user_id != user_id:
            raise HTTPException(404, "Notification not found")
        n.is_read = True
        n.read_at = datetime.utcnow()
        session.add(n)
        await session.commit()
        await session.refresh(n)
        return n

    @staticmethod
    async def mark_all_read(session: AsyncSession, user_id: str) -> int:
        result = await session.exec(
            select(Notification)
            .where(Notification.user_id == user_id, Notification.is_read == False)  # noqa
        )
        items = list(result.all())
        now = datetime.utcnow()
        for n in items:
            n.is_read = True
            n.read_at = now
            session.add(n)
        await session.commit()
        return len(items)

    @staticmethod
    async def delete(session: AsyncSession, notification_id: str, user_id: str):
        n = await session.get(Notification, notification_id)
        if not n or n.user_id != user_id:
            raise HTTPException(404, "Notification not found")
        await session.delete(n)
        await session.commit()

    @staticmethod
    async def clear_read(session: AsyncSession, user_id: str) -> int:
        result = await session.exec(
            select(Notification)
            .where(Notification.user_id == user_id, Notification.is_read == True)  # noqa
        )
        items = list(result.all())
        for n in items:
            await session.delete(n)
        await session.commit()
        return len(items)
