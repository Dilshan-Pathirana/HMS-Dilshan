"""
ChangeLog model and audit helper for tracking data mutations.

Usage in a route:
    from app.core.audit import log_change
    await log_change(session, user_id=current_user.id, action="create",
                     model_name="Branch", record_id=branch.id,
                     after_data=branch.model_dump(), request=request)
"""
from typing import Optional, Any
from datetime import datetime, timezone
from uuid import uuid4

from sqlmodel import SQLModel, Field, Column
from sqlalchemy import Text
from sqlmodel.ext.asyncio.session import AsyncSession
from fastapi import Request
import json


class ChangeLog(SQLModel, table=True):
    __tablename__ = "change_log"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    user_id: Optional[str] = Field(default=None, max_length=36)
    action: str = Field(max_length=20)  # create, update, delete
    model_name: str = Field(max_length=100, index=True)
    record_id: Optional[str] = Field(default=None, max_length=36)
    before_data: Optional[str] = Field(default=None, sa_column=Column(Text))
    after_data: Optional[str] = Field(default=None, sa_column=Column(Text))
    ip_address: Optional[str] = Field(default=None, max_length=45)
    user_agent: Optional[str] = Field(default=None, max_length=255)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


async def log_change(
    session: AsyncSession,
    *,
    user_id: Optional[str] = None,
    action: str,
    model_name: str,
    record_id: Optional[str] = None,
    before_data: Any = None,
    after_data: Any = None,
    request: Optional[Request] = None,
) -> ChangeLog:
    """Write an audit entry. Call after session.commit() of the actual change."""
    ip = None
    ua = None
    if request:
        ip = request.client.host if request.client else None
        ua = request.headers.get("user-agent", "")[:255]

    entry = ChangeLog(
        user_id=user_id,
        action=action,
        model_name=model_name,
        record_id=record_id,
        before_data=json.dumps(before_data, default=str) if before_data else None,
        after_data=json.dumps(after_data, default=str) if after_data else None,
        ip_address=ip,
        user_agent=ua,
    )
    session.add(entry)
    await session.commit()
    return entry
