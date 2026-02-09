"""Notification model – Patch 3.3"""
from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import uuid4

from sqlmodel import Field, SQLModel, Column
from sqlalchemy import Text


class NotificationBase(SQLModel):
    user_id: str = Field(foreign_key="user.id", max_length=36, index=True)
    role: Optional[str] = Field(default=None, max_length=30)
    title: str = Field(max_length=255)
    message: Optional[str] = Field(default=None, sa_column=Column(Text))
    type: str = Field(default="info", max_length=30)  # info / warning / success / error
    is_read: bool = Field(default=False)
    data: Optional[str] = Field(default=None, sa_column=Column(Text))  # JSON payload
    link: Optional[str] = Field(default=None, max_length=500)


class Notification(NotificationBase, table=True):
    __tablename__ = "notification"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    read_at: Optional[datetime] = None


class NotificationCreate(NotificationBase):
    pass


class NotificationRead(NotificationBase):
    id: str
    created_at: datetime
    read_at: Optional[datetime]
