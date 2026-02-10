from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import uuid4

from sqlmodel import Field, SQLModel


class DoctorMainQuestionBase(SQLModel):
    doctor_id: str = Field(max_length=36, index=True)
    question: str
    category: Optional[str] = Field(default=None, max_length=100)
    description: str = ""
    order: int = 0
    status: int = 1  # 1=active, 0=inactive


class DoctorMainQuestion(DoctorMainQuestionBase, table=True):
    __tablename__ = "doctor_main_question"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class DoctorMainQuestionCreate(DoctorMainQuestionBase):
    pass


class DoctorMainQuestionUpdate(SQLModel):
    doctor_id: Optional[str] = None
    question: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None
    status: Optional[int] = None


class DoctorMainQuestionAnswerBase(SQLModel):
    question_id: str = Field(max_length=36, index=True)
    answer: str


class DoctorMainQuestionAnswer(DoctorMainQuestionAnswerBase, table=True):
    __tablename__ = "doctor_main_question_answer"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class DoctorMainQuestionAnswerCreate(DoctorMainQuestionAnswerBase):
    pass
