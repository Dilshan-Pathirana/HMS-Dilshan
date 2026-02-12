"""Chatbot Service — Patch 6.0 (intent detection + live data + improved matching)"""

from sqlmodel import select, col, func, text
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import Optional
import uuid
import re
from datetime import datetime, timezone, timedelta

from app.models.chatbot import ChatbotFAQ, ChatbotLog, DiseaseMapping


# ---- Intent keywords ----
SCHEDULE_KEYWORDS = {
    "schedule", "schedules", "availability", "tomorrow", "today",
    "when", "time", "slot", "slots", "appointment", "appointments",
    "book", "booking", "free", "open", "next", "date",
}
BRANCH_KEYWORDS = {
    "branch", "branches", "location", "locations", "where", "address",
    "city", "kandy", "colombo", "galle", "hospital", "center", "centre",
    "clinic", "offices",
}
DOCTOR_KEYWORDS = {
    "doctor", "doctors", "specialist", "specialists", "specialization",
    "dr", "treat", "treats", "experience", "qualification",
}

STOP_WORDS = {
    "is", "are", "the", "a", "an", "in", "on", "at", "to", "for",
    "of", "and", "or", "it", "do", "does", "can", "will", "would",
    "there", "this", "that", "with", "from", "have", "has", "had",
    "i", "my", "me", "we", "our", "you", "your", "he", "she", "they",
    "what", "how", "be", "been", "being", "was", "were", "not", "no",
    "show", "list", "tell", "give", "get", "find", "see", "display",
}


def _stem(word: str) -> str:
    """Naive stemmer — strip common English suffixes."""
    for suffix in ("ies", "es", "s", "ing", "tion", "ment"):
        if word.endswith(suffix) and len(word) - len(suffix) >= 3:
            return word[: -len(suffix)]
    return word


class ChatbotService:

    @staticmethod
    def detect_intent(question: str) -> str:
        """Detect the intent of the user's question."""
        words = set(question.lower().split())
        q_lower = question.lower()

        # Direct word match
        schedule_score = len(words & SCHEDULE_KEYWORDS)
        branch_score = len(words & BRANCH_KEYWORDS)
        doctor_score = len(words & DOCTOR_KEYWORDS)

        # Stemmed word match (catches plurals / verb forms)
        stemmed = {_stem(w) for w in words}
        schedule_stems = {_stem(k) for k in SCHEDULE_KEYWORDS}
        branch_stems = {_stem(k) for k in BRANCH_KEYWORDS}
        doctor_stems = {_stem(k) for k in DOCTOR_KEYWORDS}
        schedule_score += len(stemmed & schedule_stems)
        branch_score += len(stemmed & branch_stems)
        doctor_score += len(stemmed & doctor_stems)

        # Substring / phrase patterns
        if any(p in q_lower for p in ["available tomorrow", "available today",
                                       "schedule for", "when can i",
                                       "any slots", "book an appointment",
                                       "book appointment", "next available"]):
            schedule_score += 3
        if any(p in q_lower for p in ["where is", "branch in", "located in",
                                       "how to reach", "nearest branch",
                                       "our branches"]):
            branch_score += 3
        if any(p in q_lower for p in ["which doctor", "find a doctor",
                                       "doctor for", "specialist for",
                                       "who treats", "show me doctor",
                                       "available doctor", "list doctor",
                                       "our doctor", "show doctor",
                                       "all doctor"]):
            doctor_score += 3

        # Pick highest score (minimum threshold 2)
        scores = {
            "schedule": schedule_score,
            "branch": branch_score,
            "doctor": doctor_score,
        }
        best = max(scores, key=scores.get)
        if scores[best] >= 2:
            return best
        return "faq"

    @staticmethod
    async def match_faq(session: AsyncSession, question: str, language: str = "en") -> Optional[ChatbotFAQ]:
        """Improved keyword matching with priority weighting."""
        q = select(ChatbotFAQ).where(ChatbotFAQ.is_active == True)
        result = await session.exec(q)
        faqs = result.all()

        q_lower = question.lower()
        q_words = set(q_lower.split()) - STOP_WORDS

        best_match: Optional[ChatbotFAQ] = None
        best_score = 0.0

        for faq in faqs:
            # Match against the question field
            faq_q = faq.question.lower()
            faq_words = set(faq_q.split()) - STOP_WORDS

            # Also match against keywords if present
            kw_str = faq.keywords or ""
            kw_words = set(k.strip().lower() for k in kw_str.split(",") if k.strip())

            # Word overlap score
            question_overlap = len(q_words & faq_words)
            keyword_overlap = len(q_words & kw_words)

            # Substring match bonus
            substring_bonus = 0
            for w in q_words:
                if len(w) >= 4 and w in faq_q:
                    substring_bonus += 1

            # Check if Sinhala question matches
            si_bonus = 0
            if language == "si" and faq.question_si:
                if any(w in faq.question_si.lower() for w in q_words if len(w) >= 2):
                    si_bonus = 2

            score = question_overlap + (keyword_overlap * 1.5) + substring_bonus + si_bonus
            # Weight by priority (higher priority = higher score)
            score *= (1 + faq.priority / 100)

            if score > best_score:
                best_score = score
                best_match = faq

        return best_match if best_score >= 2.0 else None

    @staticmethod
    async def match_disease(session: AsyncSession, question: str) -> Optional[DiseaseMapping]:
        """Check if the question matches a disease mapping."""
        q = select(DiseaseMapping).where(DiseaseMapping.is_active == True)
        result = await session.exec(q)
        mappings = result.all()

        q_lower = question.lower()
        for mapping in mappings:
            if mapping.disease_name.lower() in q_lower:
                return mapping
        return None

    @staticmethod
    async def get_live_doctors(session: AsyncSession, specialization: str = None, city: str = None) -> list[dict]:
        """Get doctors with optional specialization filter from live DB."""
        sql = """
            SELECT d.id, d.first_name, d.last_name, d.specialization,
                   GROUP_CONCAT(DISTINCT b.center_name SEPARATOR ', ') as branches
            FROM doctor d
            LEFT JOIN doctor_schedule ds ON d.id = ds.doctor_id
            LEFT JOIN branch b ON ds.branch_id = b.id
            WHERE 1=1
        """
        params = {}
        if specialization:
            sql += " AND LOWER(d.specialization) LIKE :spec"
            params["spec"] = f"%{specialization.lower()}%"
        if city:
            sql += " AND LOWER(b.center_name) LIKE :city"
            params["city"] = f"%{city.lower()}%"
        sql += " GROUP BY d.id, d.first_name, d.last_name, d.specialization LIMIT 10"

        result = await session.exec(text(sql).bindparams(**params))
        rows = result.all()
        doctors = []
        for row in rows:
            doctors.append({
                "id": row[0],
                "name": f"Dr. {row[1]} {row[2]}",
                "specialization": row[3],
                "branches": [b.strip() for b in (row[4] or "").split(",") if b.strip()],
            })
        return doctors

    @staticmethod
    async def get_live_schedules(session: AsyncSession, doctor_id: str = None,
                                  city: str = None, date_str: str = None) -> list[dict]:
        """Get upcoming doctor schedules from live DB."""
        # Map day-of-week from date
        today = datetime.now(timezone.utc).date()
        if date_str:
            try:
                target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            except ValueError:
                target_date = today + timedelta(days=1)
        else:
            target_date = today + timedelta(days=1)

        dow = target_date.isoweekday()  # 1=Monday .. 7=Sunday

        sql = """
            SELECT ds.id, d.first_name, d.last_name, b.center_name,
                   ds.day_of_week, ds.start_time, ds.end_time,
                   ds.max_patients, ds.slot_duration_minutes
            FROM doctor_schedule ds
            JOIN doctor d ON ds.doctor_id = d.id
            JOIN branch b ON ds.branch_id = b.id
            WHERE ds.status = 'active'
              AND ds.day_of_week = :dow
        """
        params: dict = {"dow": dow}
        if doctor_id:
            sql += " AND ds.doctor_id = :did"
            params["did"] = doctor_id
        if city:
            sql += " AND LOWER(b.center_name) LIKE :city"
            params["city"] = f"%{city.lower()}%"
        sql += " LIMIT 10"

        result = await session.exec(text(sql).bindparams(**params))
        rows = result.all()
        schedules = []
        for row in rows:
            schedules.append({
                "doctor_name": f"Dr. {row[1]} {row[2]}",
                "branch_name": row[3],
                "date": target_date.isoformat(),
                "time": f"{row[5]} - {row[6]}",
                "available_slots": row[7],
            })
        return schedules

    @staticmethod
    async def get_live_branches(session: AsyncSession) -> list[dict]:
        """Get all branches from live DB."""
        sql = "SELECT id, center_name, division FROM branch LIMIT 20"
        result = await session.exec(text(sql))
        rows = result.all()
        return [
            {"id": row[0], "name": row[1], "location": row[2] or ""}
            for row in rows
        ]

    @staticmethod
    async def get_suggestions(session: AsyncSession, language: str = "en") -> list[str]:
        """Return top FAQ questions as suggestions."""
        q = (
            select(ChatbotFAQ)
            .where(ChatbotFAQ.is_active == True)
            .order_by(col(ChatbotFAQ.priority).desc())
            .limit(6)
        )
        result = await session.exec(q)
        faqs = result.all()
        suggestions = []
        for faq in faqs:
            if language == "si" and faq.question_si:
                suggestions.append(faq.question_si)
            else:
                suggestions.append(faq.question)
        return suggestions

    @staticmethod
    async def log_interaction(
        session: AsyncSession,
        session_id: str,
        question: str,
        response: str,
        language: str = "en",
        category: str = "faq",
    ) -> ChatbotLog:
        log = ChatbotLog(
            session_id=session_id,
            question=question,
            response=response,
            category_detected=category,
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
        """Chatbot analytics with category breakdown."""
        total_q = select(func.count()).select_from(ChatbotLog)
        helpful_q = select(func.count()).select_from(ChatbotLog).where(ChatbotLog.was_helpful == True)
        not_helpful_q = select(func.count()).select_from(ChatbotLog).where(ChatbotLog.was_helpful == False)
        no_feedback_q = select(func.count()).select_from(ChatbotLog).where(ChatbotLog.was_helpful == None)

        total = (await session.exec(total_q)).one()
        helpful = (await session.exec(helpful_q)).one()
        not_helpful = (await session.exec(not_helpful_q)).one()
        no_feedback = (await session.exec(no_feedback_q)).one()

        # Category breakdown
        cat_q = select(
            ChatbotLog.category_detected, func.count()
        ).group_by(ChatbotLog.category_detected)
        cat_result = await session.exec(cat_q)
        category_breakdown = {}
        for row in cat_result.all():
            cat_name = row[0] or "unknown"
            category_breakdown[cat_name] = row[1]

        return {
            "total_interactions": total,
            "helpful": helpful,
            "helpful_count": helpful,
            "not_helpful": not_helpful,
            "not_helpful_count": not_helpful,
            "no_feedback_count": no_feedback,
            "satisfaction_rate": round(helpful / total * 100, 1) if total > 0 else 0,
            "helpfulness_rate": round(helpful / total * 100, 1) if total > 0 else 0,
            "category_breakdown": category_breakdown,
        }
