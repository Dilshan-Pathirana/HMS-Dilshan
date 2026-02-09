"""Chatbot Service — Patch 5.4  (FAQ-matching + logging)"""

from sqlmodel import select, col
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import Optional
import uuid

from app.models.chatbot import ChatbotFAQ, ChatbotLog


class ChatbotService:

    @staticmethod
    async def match_faq(session: AsyncSession, question: str, language: str = "en") -> Optional[ChatbotFAQ]:
        """Simple keyword matching against active FAQs."""
        q = select(ChatbotFAQ).where(
            ChatbotFAQ.is_active == True,
            ChatbotFAQ.language == language,
        )
        result = await session.exec(q)
        faqs = result.all()

        keywords = set(question.lower().split())
        best_match: Optional[ChatbotFAQ] = None
        best_score = 0

        for faq in faqs:
            faq_words = set(faq.question.lower().split())
            overlap = len(keywords & faq_words)
            if overlap > best_score:
                best_score = overlap
                best_match = faq

        return best_match if best_score >= 2 else None  # at least 2 keyword overlap

    @staticmethod
    async def get_suggestions(session: AsyncSession, language: str = "en") -> list[str]:
        """Return top FAQ questions as suggestions."""
        q = (
            select(ChatbotFAQ)
            .where(ChatbotFAQ.is_active == True, ChatbotFAQ.language == language)
            .limit(6)
        )
        result = await session.exec(q)
        return [faq.question for faq in result.all()]

    @staticmethod
    async def log_interaction(
        session: AsyncSession,
        session_id: str,
        question: str,
        response: str,
        language: str = "en",
    ) -> ChatbotLog:
        log = ChatbotLog(
            session_id=session_id,
            question=question,
            response=response,
            language=language,
        )
        session.add(log)
        await session.commit()
        await session.refresh(log)
        return log

    @staticmethod
    async def submit_feedback(session: AsyncSession, log_id: str, was_helpful: bool) -> None:
        log = await session.get(ChatbotLog, log_id)
        if log:
            log.was_helpful = was_helpful
            session.add(log)
            await session.commit()

    @staticmethod
    async def get_analytics(session: AsyncSession) -> dict:
        """Basic chatbot analytics."""
        from sqlmodel import func
        total_q = select(func.count()).select_from(ChatbotLog)
        helpful_q = select(func.count()).select_from(ChatbotLog).where(ChatbotLog.was_helpful == True)
        not_helpful_q = select(func.count()).select_from(ChatbotLog).where(ChatbotLog.was_helpful == False)

        total = (await session.exec(total_q)).one()
        helpful = (await session.exec(helpful_q)).one()
        not_helpful = (await session.exec(not_helpful_q)).one()

        return {
            "total_interactions": total,
            "helpful": helpful,
            "not_helpful": not_helpful,
            "helpfulness_rate": round(helpful / total * 100, 1) if total > 0 else 0,
        }
