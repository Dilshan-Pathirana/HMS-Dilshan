"""Medical Insights models — Patch 5.2 (Blog/Q&A)"""

from sqlmodel import SQLModel, Field, Relationship
import sqlalchemy as sa
from typing import Optional, List
from datetime import datetime, timezone
import uuid


# ---------- MedicalPost ----------

class MedicalPostBase(SQLModel):
    doctor_id: str = Field(max_length=36, index=True)
    title: str = Field(max_length=300)
    slug: str = Field(max_length=350, index=True)
    content: Optional[str] = Field(default=None, sa_column=sa.Column(sa.Text, nullable=True))
    summary: Optional[str] = Field(default=None, max_length=500)
    category: Optional[str] = Field(default=None, max_length=100)
    status: str = Field(default="draft", max_length=20)  # draft / published
    likes_count: int = Field(default=0)
    rating_avg: float = Field(default=0.0)
    published_at: Optional[datetime] = Field(default=None)

class MedicalPost(MedicalPostBase, table=True):
    __tablename__ = "medical_post"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    comments: List["PostComment"] = Relationship(back_populates="post")
    questions: List["QuestionAnswer"] = Relationship(back_populates="post")

class MedicalPostCreate(MedicalPostBase):
    pass

class MedicalPostRead(MedicalPostBase):
    id: str
    created_at: datetime
    updated_at: datetime


# ---------- PostComment ----------

class PostCommentBase(SQLModel):
    post_id: str = Field(max_length=36, foreign_key="medical_post.id", index=True)
    user_id: str = Field(max_length=36, index=True)
    content: str = Field(max_length=2000)

class PostComment(PostCommentBase, table=True):
    __tablename__ = "post_comment"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    post: Optional[MedicalPost] = Relationship(back_populates="comments")

class PostCommentCreate(PostCommentBase):
    pass

class PostCommentRead(PostCommentBase):
    id: str
    created_at: datetime


# ---------- QuestionAnswer ----------

class QuestionAnswerBase(SQLModel):
    post_id: Optional[str] = Field(default=None, max_length=36, foreign_key="medical_post.id", index=True)
    asked_by: str = Field(max_length=36, index=True)
    question_text: str = Field(max_length=2000)
    answer_text: Optional[str] = Field(default=None, max_length=5000)
    answered_by: Optional[str] = Field(default=None, max_length=36)
    is_answered: bool = Field(default=False)

class QuestionAnswer(QuestionAnswerBase, table=True):
    __tablename__ = "question_answer"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    post: Optional[MedicalPost] = Relationship(back_populates="questions")

class QuestionAnswerCreate(QuestionAnswerBase):
    pass

class QuestionAnswerRead(QuestionAnswerBase):
    id: str
    created_at: datetime
