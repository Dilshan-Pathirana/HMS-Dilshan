"""Chatbot models — Patch 6.0 (enhanced FAQ + disease mappings)"""

from sqlmodel import SQLModel, Field
import sqlalchemy as sa
from typing import Optional
from datetime import datetime, timezone
import uuid


# ---------- ChatbotFAQ ----------

class ChatbotFAQBase(SQLModel):
    question: str = Field(max_length=1000)
    answer: str = Field(sa_column=sa.Column(sa.Text, nullable=False))
    question_si: Optional[str] = Field(default=None, max_length=1000)
    answer_si: Optional[str] = Field(default=None, sa_column=sa.Column("answer_si", sa.Text, nullable=True))
    category: Optional[str] = Field(default="general_homeopathy", max_length=100)
    language: str = Field(default="en", max_length=10)
    keywords: Optional[str] = Field(default=None, sa_column=sa.Column("keywords", sa.Text, nullable=True))
    priority: int = Field(default=50)
    is_active: bool = Field(default=True)


class ChatbotFAQ(ChatbotFAQBase, table=True):
    __tablename__ = "chatbot_faq"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ChatbotFAQCreate(ChatbotFAQBase):
    pass


class ChatbotFAQRead(SQLModel):
    id: str
    question: str
    answer: str
    question_en: Optional[str] = None
    answer_en: Optional[str] = None
    question_si: Optional[str] = None
    answer_si: Optional[str] = None
    category: Optional[str] = None
    language: str = "en"
    keywords: list[str] = []
    priority: int = 50
    is_active: bool = True
    created_at: datetime
    updated_at: datetime


# ---------- ChatbotLog ----------

class ChatbotLogBase(SQLModel):
    session_id: str = Field(max_length=36, index=True)
    question: str = Field(max_length=2000)
    response: Optional[str] = Field(default=None, sa_column=sa.Column(sa.Text, nullable=True))
    category_detected: Optional[str] = Field(default=None, max_length=100)
    was_helpful: Optional[bool] = Field(default=None)
    language: str = Field(default="en", max_length=10)


class ChatbotLog(ChatbotLogBase, table=True):
    __tablename__ = "chatbot_log"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ChatbotLogCreate(ChatbotLogBase):
    pass


class ChatbotLogRead(SQLModel):
    id: str
    session_id: str
    question: str
    response: Optional[str] = None
    response_given: Optional[str] = None
    category_detected: Optional[str] = None
    was_helpful: Optional[bool] = None
    language: str = "en"
    created_at: datetime


# ---------- DiseaseMapping ----------

class DiseaseMappingBase(SQLModel):
    disease_name: str = Field(max_length=255)
    specialization: str = Field(max_length=255)
    safe_response: str = Field(sa_column=sa.Column(sa.Text, nullable=False))
    is_active: bool = Field(default=True)


class DiseaseMapping(DiseaseMappingBase, table=True):
    __tablename__ = "chatbot_disease_mapping"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class DiseaseMappingCreate(DiseaseMappingBase):
    pass


class DiseaseMappingRead(DiseaseMappingBase):
    id: str
    created_at: datetime
    updated_at: datetime


def faq_to_read(faq: ChatbotFAQ) -> dict:
    """Convert a ChatbotFAQ ORM object to the read schema dict."""
    kw_str = faq.keywords or ""
    keywords_list = [k.strip() for k in kw_str.split(",") if k.strip()] if kw_str else []
    return {
        "id": faq.id,
        "question": faq.question,
        "answer": faq.answer,
        "question_en": faq.question,
        "answer_en": faq.answer,
        "question_si": faq.question_si,
        "answer_si": faq.answer_si,
        "category": faq.category or "general_homeopathy",
        "language": faq.language,
        "keywords": keywords_list,
        "priority": faq.priority,
        "is_active": faq.is_active,
        "created_at": faq.created_at.isoformat() if faq.created_at else None,
        "updated_at": faq.updated_at.isoformat() if faq.updated_at else None,
    }


def log_to_read(log: ChatbotLog) -> dict:
    """Convert a ChatbotLog ORM object to the read schema dict."""
    return {
        "id": log.id,
        "session_id": log.session_id,
        "question": log.question,
        "response": log.response,
        "response_given": log.response,
        "category_detected": log.category_detected or "general_homeopathy",
        "was_helpful": log.was_helpful,
        "language": log.language,
        "created_at": log.created_at.isoformat() if log.created_at else None,
    }
