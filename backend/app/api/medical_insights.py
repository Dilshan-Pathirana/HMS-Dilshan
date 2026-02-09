"""Medical Insights endpoints — Patch 5.2"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import select, col
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import Optional
from datetime import datetime, timezone
import re

from app.core.database import get_session
from app.api.deps import get_current_user
from app.models.user import User
from app.models.medical_insights import (
    MedicalPost, MedicalPostRead,
    PostComment, PostCommentRead,
    QuestionAnswer, QuestionAnswerRead,
)

router = APIRouter()


def _slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    return re.sub(r"[\s_]+", "-", text)[:350]


# ---- PUBLIC ENDPOINTS ----

@router.get("/posts", response_model=list[MedicalPostRead])
async def list_published_posts(
    category: Optional[str] = None,
    q: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
):
    """Public: list published medical insight posts."""
    query = select(MedicalPost).where(MedicalPost.status == "published")
    if category:
        query = query.where(MedicalPost.category == category)
    if q:
        query = query.where(col(MedicalPost.title).ilike(f"%{q}%"))
    query = query.order_by(col(MedicalPost.published_at).desc()).offset(skip).limit(limit)
    result = await session.exec(query)
    return list(result.all())


@router.get("/posts/{post_id}", response_model=MedicalPostRead)
async def get_post(post_id: str, session: AsyncSession = Depends(get_session)):
    post = await session.get(MedicalPost, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@router.get("/posts/{post_id}/comments", response_model=list[PostCommentRead])
async def list_comments(
    post_id: str,
    skip: int = 0,
    limit: int = 50,
    session: AsyncSession = Depends(get_session),
):
    query = select(PostComment).where(PostComment.post_id == post_id).order_by(col(PostComment.created_at).desc()).offset(skip).limit(limit)
    result = await session.exec(query)
    return list(result.all())


@router.post("/posts/{post_id}/comments", response_model=PostCommentRead, status_code=201)
async def add_comment(
    post_id: str,
    payload: dict,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    post = await session.get(MedicalPost, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    comment = PostComment(
        post_id=post_id,
        user_id=current_user.id,
        content=payload.get("content", ""),
    )
    session.add(comment)
    await session.commit()
    await session.refresh(comment)
    return comment


@router.post("/posts/{post_id}/like")
async def like_post(
    post_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    post = await session.get(MedicalPost, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    post.likes_count += 1
    session.add(post)
    await session.commit()
    return {"likes_count": post.likes_count}


@router.post("/posts/{post_id}/rate")
async def rate_post(
    post_id: str,
    payload: dict,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    post = await session.get(MedicalPost, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    rating = payload.get("rating", 0)
    if not (1 <= rating <= 5):
        raise HTTPException(status_code=400, detail="Rating must be 1-5")
    # Simple average update (approximation — production should track individual ratings)
    post.rating_avg = round((post.rating_avg + rating) / 2, 2) if post.rating_avg > 0 else float(rating)
    session.add(post)
    await session.commit()
    return {"rating_avg": post.rating_avg}


# ---- Q&A ----

@router.post("/posts/{post_id}/questions", response_model=QuestionAnswerRead, status_code=201)
async def ask_question(
    post_id: str,
    payload: dict,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    qa = QuestionAnswer(
        post_id=post_id,
        asked_by=current_user.id,
        question_text=payload.get("question", ""),
    )
    session.add(qa)
    await session.commit()
    await session.refresh(qa)
    return qa


@router.get("/posts/{post_id}/questions", response_model=list[QuestionAnswerRead])
async def list_questions(
    post_id: str,
    session: AsyncSession = Depends(get_session),
):
    query = select(QuestionAnswer).where(QuestionAnswer.post_id == post_id).order_by(col(QuestionAnswer.created_at).desc())
    result = await session.exec(query)
    return list(result.all())


# ---- DOCTOR: MY POSTS ----

@router.get("/my-posts", response_model=list[MedicalPostRead])
async def my_posts(
    status: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    query = select(MedicalPost).where(MedicalPost.doctor_id == current_user.id)
    if status:
        query = query.where(MedicalPost.status == status)
    query = query.order_by(col(MedicalPost.created_at).desc())
    result = await session.exec(query)
    return list(result.all())


@router.post("/my-posts", response_model=MedicalPostRead, status_code=201)
async def create_post(
    payload: dict,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    title = payload.get("title", "Untitled")
    post = MedicalPost(
        doctor_id=current_user.id,
        title=title,
        slug=_slugify(title),
        content=payload.get("content"),
        summary=payload.get("summary"),
        category=payload.get("category"),
        status=payload.get("status", "draft"),
    )
    if post.status == "published":
        post.published_at = datetime.now(timezone.utc)
    session.add(post)
    await session.commit()
    await session.refresh(post)
    return post


@router.put("/my-posts/{post_id}", response_model=MedicalPostRead)
async def update_post(
    post_id: str,
    payload: dict,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    post = await session.get(MedicalPost, post_id)
    if not post or post.doctor_id != current_user.id:
        raise HTTPException(status_code=404, detail="Post not found")
    for key in ("title", "content", "summary", "category", "status"):
        if key in payload:
            setattr(post, key, payload[key])
    if payload.get("title"):
        post.slug = _slugify(payload["title"])
    if post.status == "published" and not post.published_at:
        post.published_at = datetime.now(timezone.utc)
    post.updated_at = datetime.now(timezone.utc)
    session.add(post)
    await session.commit()
    await session.refresh(post)
    return post


@router.delete("/my-posts/{post_id}")
async def delete_post(
    post_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    post = await session.get(MedicalPost, post_id)
    if not post or post.doctor_id != current_user.id:
        raise HTTPException(status_code=404, detail="Post not found")
    await session.delete(post)
    await session.commit()
    return {"message": "Post deleted"}


# ---- DOCTOR: PENDING QUESTIONS ----

@router.get("/pending-questions", response_model=list[QuestionAnswerRead])
async def pending_questions(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """List unanswered questions on doctor's posts."""
    query = (
        select(QuestionAnswer)
        .join(MedicalPost, QuestionAnswer.post_id == MedicalPost.id)
        .where(MedicalPost.doctor_id == current_user.id)
        .where(QuestionAnswer.is_answered == False)
        .order_by(col(QuestionAnswer.created_at).desc())
    )
    result = await session.exec(query)
    return list(result.all())


@router.put("/questions/{question_id}/answer", response_model=QuestionAnswerRead)
async def answer_question(
    question_id: str,
    payload: dict,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    qa = await session.get(QuestionAnswer, question_id)
    if not qa:
        raise HTTPException(status_code=404, detail="Question not found")
    qa.answer_text = payload.get("answer", "")
    qa.answered_by = current_user.id
    qa.is_answered = True
    session.add(qa)
    await session.commit()
    await session.refresh(qa)
    return qa
