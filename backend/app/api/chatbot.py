"""Chatbot endpoints — Patch 5.4 (replaces dummy stubs)"""

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlmodel import select, col
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import Optional
import uuid

from app.core.database import get_session
from app.api.deps import get_current_user
from app.models.user import User
from app.models.chatbot import ChatbotFAQ, ChatbotFAQRead, ChatbotLog, ChatbotLogRead
from app.services.chatbot_service import ChatbotService

router = APIRouter()
svc = ChatbotService


# ---- PUBLIC CHAT ----

@router.post("/chat")
async def chat(
    request: Request,
    session: AsyncSession = Depends(get_session),
):
    """Chat endpoint — matches FAQs by keyword overlap."""
    body = await request.json()
    question = body.get("message", body.get("question", ""))
    language = body.get("language", "en")
    session_id = body.get("session_id", str(uuid.uuid4()))

    faq = await svc.match_faq(session, question, language)
    if faq:
        response_text = faq.answer
    else:
        response_text = (
            "I'm sorry, I couldn't find a matching answer. "
            "You can try rephrasing your question, or contact the hospital directly."
        )

    log = await svc.log_interaction(session, session_id, question, response_text, language)

    suggestions = await svc.get_suggestions(session, language)

    return {
        "success": True,
        "response": response_text,
        "interaction_id": log.id,
        "suggestions": suggestions[:4],
    }


@router.get("/suggestions")
async def suggestions(
    language: str = "en",
    session: AsyncSession = Depends(get_session),
):
    return {"suggestions": await svc.get_suggestions(session, language)}


@router.post("/feedback")
async def feedback(
    request: Request,
    session: AsyncSession = Depends(get_session),
):
    body = await request.json()
    log_id = body.get("interaction_id", body.get("log_id", ""))
    was_helpful = body.get("was_helpful", body.get("helpful", True))
    await svc.submit_feedback(session, log_id, was_helpful)
    return {"success": True}


# ---- ADMIN: FAQ CRUD ----

@router.get("/admin/faqs", response_model=list[ChatbotFAQRead])
async def list_faqs(
    language: Optional[str] = None,
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role_as != 1:
        raise HTTPException(status_code=403, detail="Admin only")
    q = select(ChatbotFAQ)
    if language:
        q = q.where(ChatbotFAQ.language == language)
    if category:
        q = q.where(ChatbotFAQ.category == category)
    q = q.order_by(col(ChatbotFAQ.created_at).desc()).offset(skip).limit(limit)
    result = await session.exec(q)
    return list(result.all())


@router.post("/admin/faqs", response_model=ChatbotFAQRead, status_code=201)
async def create_faq(
    payload: dict,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role_as != 1:
        raise HTTPException(status_code=403, detail="Admin only")
    faq = ChatbotFAQ(
        question=payload.get("question", ""),
        answer=payload.get("answer", ""),
        category=payload.get("category"),
        language=payload.get("language", "en"),
        is_active=payload.get("is_active", True),
    )
    session.add(faq)
    await session.commit()
    await session.refresh(faq)
    return faq


@router.put("/admin/faqs/{faq_id}", response_model=ChatbotFAQRead)
async def update_faq(
    faq_id: str,
    payload: dict,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role_as != 1:
        raise HTTPException(status_code=403, detail="Admin only")
    faq = await session.get(ChatbotFAQ, faq_id)
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
    for key in ("question", "answer", "category", "language", "is_active"):
        if key in payload:
            setattr(faq, key, payload[key])
    from datetime import datetime, timezone
    faq.updated_at = datetime.now(timezone.utc)
    session.add(faq)
    await session.commit()
    await session.refresh(faq)
    return faq


@router.delete("/admin/faqs/{faq_id}")
async def delete_faq(
    faq_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role_as != 1:
        raise HTTPException(status_code=403, detail="Admin only")
    faq = await session.get(ChatbotFAQ, faq_id)
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
    await session.delete(faq)
    await session.commit()
    return {"message": "FAQ deleted"}


# ---- ADMIN: LOGS & ANALYTICS ----

@router.get("/admin/logs", response_model=list[ChatbotLogRead])
async def list_logs(
    session_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role_as != 1:
        raise HTTPException(status_code=403, detail="Admin only")
    q = select(ChatbotLog)
    if session_id:
        q = q.where(ChatbotLog.session_id == session_id)
    q = q.order_by(col(ChatbotLog.created_at).desc()).offset(skip).limit(limit)
    result = await session.exec(q)
    return list(result.all())


@router.get("/admin/analytics")
async def chatbot_analytics(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role_as != 1:
        raise HTTPException(status_code=403, detail="Admin only")
    return await svc.get_analytics(session)
