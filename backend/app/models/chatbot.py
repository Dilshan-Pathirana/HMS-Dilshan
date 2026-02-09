"""Chatbot models — Patch 5.4"""

from sqlmodel import SQLModel, Field
import sqlalchemy as sa
from typing import Optional
from datetime import datetime, timezone
import uuid


# ---------- ChatbotFAQ ----------

class ChatbotFAQBase(SQLModel):
    question: str = Field(max_length=1000)
    answer: str = Field(sa_column=sa.Column(sa.Text, nullable=False))
    category: Optional[str] = Field(default=None, max_length=100)
    language: str = Field(default="en", max_length=10)
    is_active: bool = Field(default=True)

class ChatbotFAQ(ChatbotFAQBase, table=True):
    __tablename__ = "chatbot_faq"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatbotFAQCreate(ChatbotFAQBase):
    pass

class ChatbotFAQRead(ChatbotFAQBase):
    id: str
    created_at: datetime
    updated_at: datetime


# ---------- ChatbotLog ----------

class ChatbotLogBase(SQLModel):
    session_id: str = Field(max_length=36, index=True)
    question: str = Field(max_length=2000)
    response: Optional[str] = Field(default=None, sa_column=sa.Column(sa.Text, nullable=True))
    was_helpful: Optional[bool] = Field(default=None)
    language: str = Field(default="en", max_length=10)

class ChatbotLog(ChatbotLogBase, table=True):
    __tablename__ = "chatbot_log"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatbotLogCreate(ChatbotLogBase):
    pass

class ChatbotLogRead(ChatbotLogBase):
    id: str
    created_at: datetime
