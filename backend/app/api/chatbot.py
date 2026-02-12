"""Chatbot endpoints — Patch 6.0 (full hybrid AI + live data)"""

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlmodel import select, col
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import Optional
from datetime import datetime, timezone
import uuid

from app.core.database import get_session
from app.api.deps import get_current_user
from app.models.user import User
from app.models.chatbot import (
    ChatbotFAQ, ChatbotLog, DiseaseMapping,
    faq_to_read, log_to_read,
)
from app.services.chatbot_service import ChatbotService

router = APIRouter()
svc = ChatbotService


# ──────────── PUBLIC CHAT ────────────

@router.post("/chat")
async def chat(
    request: Request,
    session: AsyncSession = Depends(get_session),
):
    """Hybrid chat — FAQ matching + intent detection + live data."""
    body = await request.json()
    question = body.get("message", body.get("question", ""))
    language = body.get("language", "en")
    session_id = body.get("session_id", str(uuid.uuid4()))

    intent = svc.detect_intent(question)
    response_text = ""
    data = {}
    category = intent
    disclaimer = None

    if intent == "schedule":
        # Extract city hint from question
        city = None
        for c in ["kandy", "colombo", "galle", "kurunegala", "matara", "jaffna"]:
            if c in question.lower():
                city = c
                break
        schedules = await svc.get_live_schedules(session, city=city)
        if schedules:
            response_text = f"Here are the available doctor schedules:\n"
            for s in schedules[:5]:
                response_text += f"\n• {s['doctor_name']} at {s['branch_name']}\n  📅 {s['date']} | ⏰ {s['time']} | 🎫 {s['available_slots']} slots"
            data["schedules"] = schedules[:5]
        else:
            response_text = "I couldn't find any schedules matching your query. Please try a different date or location."
        disclaimer = "Schedule availability may change. Please confirm when booking."

    elif intent == "branch":
        branches = await svc.get_live_branches(session)
        if branches:
            response_text = "Here are our branch locations:\n"
            for b in branches:
                response_text += f"\n• {b['name']}"
                if b['location']:
                    response_text += f" — 📍 {b['location']}"
            data["branches"] = branches
        else:
            response_text = "I couldn't retrieve branch information right now."

    elif intent == "doctor":
        # Extract specialization hint
        spec = None
        for s in ["homeopathy", "dermatology", "pediatric", "general", "allergy", "respiratory"]:
            if s in question.lower():
                spec = s
                break
        doctors = await svc.get_live_doctors(session, specialization=spec)
        if doctors:
            response_text = "Here are our available doctors:\n"
            for d in doctors[:5]:
                response_text += f"\n• {d['name']} — {d['specialization']}"
                if d['branches']:
                    response_text += f"\n  📍 {', '.join(d['branches'])}"
            data["doctors"] = doctors[:5]
        else:
            response_text = "I couldn't find doctors matching your query."

    else:
        # FAQ matching
        # First check disease mappings
        disease = await svc.match_disease(session, question)
        if disease:
            response_text = disease.safe_response
            # Also find doctors for this specialization
            doctors = await svc.get_live_doctors(session, specialization=disease.specialization)
            if doctors:
                response_text += f"\n\nWe have specialists available:"
                for d in doctors[:3]:
                    response_text += f"\n• {d['name']} — {d['specialization']}"
                data["doctors"] = doctors[:3]
            category = "disease"
            disclaimer = "This is general information only. Please consult a qualified homeopathic doctor."
        else:
            faq = await svc.match_faq(session, question, language)
            if faq:
                if language == "si" and faq.answer_si:
                    response_text = faq.answer_si
                else:
                    response_text = faq.answer
                category = faq.category or "faq"
            else:
                if language == "si":
                    response_text = (
                        "සමාවන්න, ඔබේ ප්‍රශ්නයට ගැළපෙන පිළිතුරක් සොයාගත නොහැකි විය. "
                        "කරුණාකර වෙනත් ආකාරයකින් ඇසීමට උත්සාහ කරන්න, නැතහොත් රෝහල සෘජුවම අමතන්න."
                    )
                else:
                    response_text = (
                        "I'm sorry, I couldn't find a matching answer. "
                        "You can try rephrasing your question, or contact the hospital directly."
                    )
                category = "unknown"

    log = await svc.log_interaction(session, session_id, question, response_text, language, category)
    suggestions = await svc.get_suggestions(session, language)

    result = {
        "success": True,
        "response": response_text,
        "category": category,
        "interaction_id": log.id,
        "suggestions": suggestions[:4],
        "language": language,
    }
    if data:
        result["data"] = data
    if disclaimer:
        result["disclaimer"] = disclaimer
    return result


@router.get("/suggestions")
async def suggestions(
    language: str = "en",
    session: AsyncSession = Depends(get_session),
):
    sug = await svc.get_suggestions(session, language)
    return {
        "suggestions": sug,
        "categories": [
            {"key": "general_homeopathy", "label": "General Homeopathy", "examples": ["What is homeopathy?"]},
            {"key": "doctor_info", "label": "Doctor Information", "examples": ["Find a doctor"]},
            {"key": "hospital_info", "label": "Hospital/Branch Info", "examples": ["Where are your branches?"]},
            {"key": "appointment", "label": "Appointments", "examples": ["Book an appointment"]},
        ],
    }


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


# ──────────── LIVE DATA PUBLIC ENDPOINTS ────────────

@router.get("/live/doctors")
async def live_doctors(
    specialization: Optional[str] = None,
    city: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
):
    doctors = await svc.get_live_doctors(session, specialization=specialization, city=city)
    return {"success": True, "data": doctors}


@router.get("/live/schedules")
async def live_schedules(
    doctor_id: Optional[str] = None,
    city: Optional[str] = None,
    date: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
):
    schedules = await svc.get_live_schedules(session, doctor_id=doctor_id, city=city, date_str=date)
    return {"success": True, "data": schedules}


@router.get("/live/branches")
async def live_branches(
    session: AsyncSession = Depends(get_session),
):
    branches = await svc.get_live_branches(session)
    return {"success": True, "data": branches}


@router.get("/faq")
async def public_faq_list(
    session: AsyncSession = Depends(get_session),
):
    """Public FAQ list."""
    q = select(ChatbotFAQ).where(ChatbotFAQ.is_active == True).order_by(col(ChatbotFAQ.priority).desc())
    result = await session.exec(q)
    return {"success": True, "data": [faq_to_read(f) for f in result.all()]}


@router.get("/faq/search")
async def public_faq_search(
    q: str = "",
    session: AsyncSession = Depends(get_session),
):
    """Search FAQs by keyword."""
    stmt = select(ChatbotFAQ).where(ChatbotFAQ.is_active == True)
    if q:
        stmt = stmt.where(
            col(ChatbotFAQ.question).icontains(q) | col(ChatbotFAQ.keywords).icontains(q)
        )
    stmt = stmt.order_by(col(ChatbotFAQ.priority).desc()).limit(20)
    result = await session.exec(stmt)
    return {"success": True, "data": [faq_to_read(f) for f in result.all()]}


# ──────────── ADMIN: FAQ CRUD ────────────

@router.get("/admin/faqs")
async def list_faqs(
    language: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
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
    if search:
        q = q.where(
            col(ChatbotFAQ.question).icontains(search) | col(ChatbotFAQ.keywords).icontains(search)
        )
    q = q.order_by(col(ChatbotFAQ.priority).desc(), col(ChatbotFAQ.created_at).desc()).offset(skip).limit(limit)
    result = await session.exec(q)
    faqs = [faq_to_read(f) for f in result.all()]
    return {"success": True, "data": faqs}


@router.post("/admin/faqs", status_code=201)
async def create_faq(
    payload: dict,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role_as != 1:
        raise HTTPException(status_code=403, detail="Admin only")

    # Handle keywords — accept list or string
    keywords_raw = payload.get("keywords", "")
    if isinstance(keywords_raw, list):
        keywords_str = ", ".join(keywords_raw)
    else:
        keywords_str = keywords_raw

    faq = ChatbotFAQ(
        question=payload.get("question_en", payload.get("question", "")),
        answer=payload.get("answer_en", payload.get("answer", "")),
        question_si=payload.get("question_si") or None,
        answer_si=payload.get("answer_si") or None,
        category=payload.get("category", "general_homeopathy"),
        language=payload.get("language", "en"),
        keywords=keywords_str or None,
        priority=payload.get("priority", 50),
        is_active=payload.get("is_active", True),
    )
    session.add(faq)
    await session.commit()
    await session.refresh(faq)
    return {"success": True, "data": faq_to_read(faq)}


@router.put("/admin/faqs/{faq_id}")
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

    if "question_en" in payload:
        faq.question = payload["question_en"]
    elif "question" in payload:
        faq.question = payload["question"]
    if "answer_en" in payload:
        faq.answer = payload["answer_en"]
    elif "answer" in payload:
        faq.answer = payload["answer"]
    if "question_si" in payload:
        faq.question_si = payload["question_si"] or None
    if "answer_si" in payload:
        faq.answer_si = payload["answer_si"] or None
    if "category" in payload:
        faq.category = payload["category"]
    if "language" in payload:
        faq.language = payload["language"]
    if "is_active" in payload:
        faq.is_active = payload["is_active"]
    if "priority" in payload:
        faq.priority = payload["priority"]
    if "keywords" in payload:
        kw = payload["keywords"]
        if isinstance(kw, list):
            faq.keywords = ", ".join(kw)
        else:
            faq.keywords = kw

    faq.updated_at = datetime.now(timezone.utc)
    session.add(faq)
    await session.commit()
    await session.refresh(faq)
    return {"success": True, "data": faq_to_read(faq)}


@router.patch("/admin/faqs/{faq_id}/toggle-status")
async def toggle_faq_status(
    faq_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role_as != 1:
        raise HTTPException(status_code=403, detail="Admin only")
    faq = await session.get(ChatbotFAQ, faq_id)
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
    faq.is_active = not faq.is_active
    faq.updated_at = datetime.now(timezone.utc)
    session.add(faq)
    await session.commit()
    await session.refresh(faq)
    return {"success": True, "data": faq_to_read(faq)}


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
    return {"success": True, "message": "FAQ deleted"}


# ──────────── ADMIN: DISEASE MAPPINGS ────────────

@router.get("/admin/disease-mappings")
async def list_disease_mappings(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role_as != 1:
        raise HTTPException(status_code=403, detail="Admin only")
    q = select(DiseaseMapping).order_by(col(DiseaseMapping.created_at).desc())
    result = await session.exec(q)
    mappings = result.all()
    return {"success": True, "data": [m.model_dump() for m in mappings]}


@router.post("/admin/disease-mappings", status_code=201)
async def create_disease_mapping(
    payload: dict,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role_as != 1:
        raise HTTPException(status_code=403, detail="Admin only")
    mapping = DiseaseMapping(
        disease_name=payload.get("disease_name", ""),
        specialization=payload.get("specialization", ""),
        safe_response=payload.get("safe_response", ""),
        is_active=payload.get("is_active", True),
    )
    session.add(mapping)
    await session.commit()
    await session.refresh(mapping)
    return {"success": True, "data": mapping.model_dump()}


@router.put("/admin/disease-mappings/{mapping_id}")
async def update_disease_mapping(
    mapping_id: str,
    payload: dict,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role_as != 1:
        raise HTTPException(status_code=403, detail="Admin only")
    mapping = await session.get(DiseaseMapping, mapping_id)
    if not mapping:
        raise HTTPException(status_code=404, detail="Mapping not found")
    for key in ("disease_name", "specialization", "safe_response", "is_active"):
        if key in payload:
            setattr(mapping, key, payload[key])
    mapping.updated_at = datetime.now(timezone.utc)
    session.add(mapping)
    await session.commit()
    await session.refresh(mapping)
    return {"success": True, "data": mapping.model_dump()}


@router.delete("/admin/disease-mappings/{mapping_id}")
async def delete_disease_mapping(
    mapping_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role_as != 1:
        raise HTTPException(status_code=403, detail="Admin only")
    mapping = await session.get(DiseaseMapping, mapping_id)
    if not mapping:
        raise HTTPException(status_code=404, detail="Mapping not found")
    await session.delete(mapping)
    await session.commit()
    return {"success": True, "message": "Mapping deleted"}


# ──────────── ADMIN: LOGS & ANALYTICS ────────────

@router.get("/admin/logs")
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
    logs = [log_to_read(log) for log in result.all()]
    return {"success": True, "data": logs}


@router.get("/admin/analytics")
async def chatbot_analytics(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role_as != 1:
        raise HTTPException(status_code=403, detail="Admin only")
    return await svc.get_analytics(session)


# ──────────── ADMIN: SEED ────────────

@router.post("/admin/seed-faqs")
async def seed_faqs(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Seed 40 homeopathy FAQs if table is empty."""
    if current_user.role_as != 1:
        raise HTTPException(status_code=403, detail="Admin only")

    from sqlmodel import func
    count_q = select(func.count()).select_from(ChatbotFAQ)
    existing = (await session.exec(count_q)).one()
    if existing > 0:
        return {"success": True, "message": f"Already have {existing} FAQs, skipping seed."}

    seed_data = [
        ("What is Homeopathy?", "A natural medical system based on 'like cures like'. It uses highly diluted substances to trigger the body's natural healing.", "homeopathy, natural, medicine, what"),
        ("Is homeopathy safe?", "Yes, homeopathy is safe and non-toxic. The remedies are highly diluted and have no harmful chemicals.", "safe, safety, toxic, side effects"),
        ("Can children use homeopathy?", "Yes, homeopathy is safe for children of all ages. The gentle remedies are well-suited for pediatric care.", "children, kids, pediatric, baby"),
        ("Can pregnant women use it?", "Yes, homeopathy can be used during pregnancy under proper doctor guidance. Many remedies are safe for expectant mothers.", "pregnant, pregnancy, expecting, maternal"),
        ("Does homeopathy treat chronic diseases?", "Yes, homeopathy focuses on treating the root causes of chronic diseases rather than just managing symptoms.", "chronic, long-term, disease, root cause"),
        ("Does homeopathy have side effects?", "No harmful side effects when used correctly under a qualified practitioner's guidance.", "side effects, harmful, reaction, adverse"),
        ("How long does it take to work?", "The duration depends on the condition, its severity, and the individual patient. Acute conditions may respond quickly, while chronic ones take longer.", "time, duration, how long, work, effective"),
        ("Can homeopathy treat allergies?", "Yes, homeopathy is very effective in treating various types of allergies including skin, respiratory, and food allergies.", "allergy, allergies, allergic, reaction"),
        ("Can it treat skin diseases?", "Yes, homeopathy can treat skin conditions such as eczema, acne, psoriasis, and dermatitis.", "skin, eczema, acne, psoriasis, dermatitis"),
        ("Does it boost immunity?", "Yes, homeopathic remedies can help strengthen the immune system naturally.", "immunity, immune, boost, strengthen, defense"),
        ("Can homeopathy treat migraines?", "Yes, homeopathy offers effective treatment for migraines and recurring headaches.", "migraine, headache, head pain, recurring"),
        ("Is it good for stress and anxiety?", "Yes, homeopathy provides holistic treatment for stress, anxiety, and related mental health conditions.", "stress, anxiety, mental, tension, worry"),
        ("Does it treat asthma?", "Yes, homeopathy can help manage and treat asthma under proper medical guidance.", "asthma, breathing, respiratory, wheeze"),
        ("Can it cure sinusitis?", "Yes, homeopathy offers effective treatment for sinusitis and related nasal conditions.", "sinus, sinusitis, nasal, congestion"),
        ("Does homeopathy help digestion?", "Yes, homeopathy can effectively treat digestive issues including IBS, indigestion, and bloating.", "digestion, digestive, stomach, ibs, bloating"),
        ("Can it help diabetes?", "Yes, homeopathy can be used as supportive care alongside conventional diabetes treatment.", "diabetes, sugar, blood sugar, insulin"),
        ("Can it help arthritis?", "Yes, homeopathy provides effective treatment for arthritis and joint pain.", "arthritis, joint, pain, rheumatism"),
        ("Can it help insomnia?", "Yes, homeopathy can treat insomnia and sleep disorders naturally without habit-forming medications.", "insomnia, sleep, sleepless, rest"),
        ("Is it suitable for elderly?", "Yes, homeopathy is well-suited for elderly patients due to its gentle, non-toxic nature.", "elderly, old, senior, aged"),
        ("Can it treat hair fall?", "Yes, homeopathy can help treat hair fall and promote healthy hair growth.", "hair, hair fall, hair loss, baldness, alopecia"),
        ("Can it treat infertility?", "Yes, homeopathy can help with infertility in many cases by addressing underlying hormonal and health issues.", "infertility, fertility, conceive, reproductive"),
        ("Does it help heart conditions?", "Homeopathy can be used as supportive therapy for heart conditions alongside conventional treatment.", "heart, cardiac, cardiovascular, blood pressure"),
        ("Can it treat piles?", "Yes, homeopathy offers effective treatment for piles (hemorrhoids) without surgery.", "piles, hemorrhoids, rectal, bleeding"),
        ("Can it treat gastritis?", "Yes, homeopathy can effectively treat gastritis and acid reflux conditions.", "gastritis, acid, reflux, stomach, gastric"),
        ("Does it cure thyroid disorders?", "Homeopathy helps manage thyroid disorders and can regulate thyroid function naturally.", "thyroid, hypothyroid, hyperthyroid, goiter"),
        ("Can it treat depression?", "Yes, homeopathy treats depression holistically by addressing mental, emotional, and physical aspects.", "depression, depressed, sad, mental health, mood"),
        ("Can homeopathy treat fever?", "Yes, homeopathy has effective remedies for various types of fever.", "fever, temperature, hot, pyrexia"),
        ("Is homeopathy slow?", "Homeopathy is gentle but effective. Acute conditions often respond quickly, while chronic conditions require consistent treatment.", "slow, fast, speed, quick, time"),
        ("Is it expensive?", "Homeopathy is usually very affordable compared to conventional medicine. Treatment costs are generally low.", "expensive, cost, price, affordable, cheap"),
        ("Can it be taken with allopathy?", "Yes, homeopathy can be safely taken alongside allopathic medicine with proper medical guidance.", "allopathy, conventional, together, combine, western"),
        ("Does it work for children's behavior?", "Yes, homeopathy can help with behavioral issues in children including ADHD, tantrums, and concentration.", "behavior, behavioral, adhd, tantrum, concentration, children"),
        ("Can it help immunity in kids?", "Yes, homeopathy can effectively boost immunity in children, reducing frequency of infections.", "immunity, kids, children, infection, boost, pediatric"),
        ("Can it treat PCOS?", "Yes, homeopathy offers effective treatment for PCOS by addressing hormonal imbalances.", "pcos, polycystic, ovary, hormonal, reproductive"),
        ("Can it treat gastric ulcers?", "Yes, homeopathy can effectively treat gastric ulcers and promote healing.", "gastric, ulcer, stomach ulcer, peptic"),
        ("Does it cure arthritis pain?", "Yes, homeopathy can provide effective relief from arthritis pain and inflammation.", "arthritis, pain, joint pain, inflammation, relief"),
        ("Does it treat hypertension?", "Homeopathy can be used as supportive care for hypertension alongside conventional treatment.", "hypertension, blood pressure, high bp, pressure"),
        ("Can it treat common cold?", "Yes, homeopathy has many effective remedies for common cold and flu symptoms.", "cold, flu, cough, runny nose, sneezing"),
        ("Can it treat back pain?", "Yes, homeopathy provides effective treatment for back pain and spinal conditions.", "back pain, spine, spinal, lumbar, backache"),
        ("Can it treat liver disorders?", "Yes, homeopathy can support liver health and treat liver disorders as supportive therapy.", "liver, hepatic, jaundice, fatty liver"),
        ("Can homeopathy cure diseases permanently?", "Homeopathy aims for long-term healing by treating the root cause. Many patients experience permanent relief from chronic conditions.", "cure, permanent, long-term, lasting, complete"),
    ]

    for question, answer, keywords in seed_data:
        faq = ChatbotFAQ(
            question=question,
            answer=answer,
            keywords=keywords,
            category="general_homeopathy",
            language="en",
            priority=50,
            is_active=True,
        )
        session.add(faq)

    await session.commit()
    return {"success": True, "message": f"Seeded {len(seed_data)} FAQs successfully."}
