"""Legacy-compatible endpoints for doctor "main questions" and their answer options.

These are used by the dashboard modules under:
- Patient Section: create/list questions
- Doctor Section: doctor-specific list

Frontend currently calls endpoints like:
- GET  /api/v1/get-all-doctor-questions
- GET  /api/v1/get-doctor-questions/{doctor_user_id}
- POST /api/v1/api/add-main-question
- PUT  /api/v1/update-main-question/{id}
- DELETE /api/v1/delete-main-question/{id}
- GET  /api/v1/get-question-answers/{question_id}

This router implements those paths (and the `/api/...` variants) to avoid 404s.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_session
from app.models.doctor import Doctor
from app.models.user import User
from app.models.doctor_main_question import (
    DoctorMainQuestion,
    DoctorMainQuestionAnswer,
    DoctorMainQuestionAnswerCreate,
    DoctorMainQuestionCreate,
    DoctorMainQuestionUpdate,
)

router = APIRouter()


def _require_staff_or_self_doctor(current_user: User, doctor_user_id: str) -> None:
    if current_user.role_as in (1, 2):
        return
    if current_user.role_as == 3 and current_user.id == doctor_user_id:
        return
    raise HTTPException(status_code=403, detail="Not enough privileges")


async def _doctor_name_map(session: AsyncSession, doctor_user_ids: List[str]) -> Dict[str, Dict[str, str]]:
    if not doctor_user_ids:
        return {}
    q = select(Doctor).where(Doctor.user_id.in_(doctor_user_ids))
    res = await session.exec(q)
    doctors = res.all() or []
    out: Dict[str, Dict[str, str]] = {}
    for d in doctors:
        out[d.user_id] = {
            "doctor_first_name": d.first_name,
            "doctor_last_name": d.last_name,
        }
    return out


@router.get("/api/get-doctors")
@router.get("/get-doctors")
async def get_doctors(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    res = await session.exec(select(Doctor).order_by(Doctor.first_name, Doctor.last_name))
    doctors = res.all() or []
    return {
        "status": 200,
        "doctors": [
            {
                "user_id": d.user_id,
                "first_name": d.first_name,
                "last_name": d.last_name,
            }
            for d in doctors
        ],
    }


@router.post("/api/add-main-question")
@router.post("/add-main-question")
async def add_main_question(
    payload: DoctorMainQuestionCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    doctor_id = payload.doctor_id
    # Doctors can only create questions for themselves
    if current_user.role_as == 3:
        doctor_id = current_user.id

    if current_user.role_as not in (1, 2, 3):
        raise HTTPException(status_code=403, detail="Not enough privileges")

    q = DoctorMainQuestion(
        doctor_id=doctor_id,
        question=payload.question,
        description=payload.description,
        order=payload.order,
        status=payload.status,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    session.add(q)
    await session.commit()
    await session.refresh(q)
    return {"status": 200, "message": "Main question created successfully", "question": q.model_dump()}


@router.get("/get-all-doctor-questions")
@router.get("/api/get-all-doctor-questions")
async def get_all_doctor_questions(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    stmt = select(DoctorMainQuestion)
    if current_user.role_as not in (1, 2):
        stmt = stmt.where(DoctorMainQuestion.status == 1)

    res = await session.exec(stmt.order_by(DoctorMainQuestion.order))
    questions = res.all() or []
    name_map = await _doctor_name_map(session, [q.doctor_id for q in questions])

    return {
        "status": 200,
        "doctor_questions": [
            {
                **q.model_dump(),
                "doctor_first_name": name_map.get(q.doctor_id, {}).get("doctor_first_name", ""),
                "doctor_last_name": name_map.get(q.doctor_id, {}).get("doctor_last_name", ""),
            }
            for q in questions
        ],
    }


@router.get("/get-doctor-questions/{doctor_user_id}")
async def get_doctor_questions(
    doctor_user_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    _require_staff_or_self_doctor(current_user, doctor_user_id)

    res = await session.exec(
        select(DoctorMainQuestion)
        .where(DoctorMainQuestion.doctor_id == doctor_user_id)
        .order_by(DoctorMainQuestion.order)
    )
    questions = res.all() or []

    # Resolve doctor name (single)
    name_map = await _doctor_name_map(session, [doctor_user_id])
    fn = name_map.get(doctor_user_id, {}).get("doctor_first_name", "")
    ln = name_map.get(doctor_user_id, {}).get("doctor_last_name", "")

    return {
        "status": 200,
        "doctor_questions": [
            {
                **q.model_dump(),
                "doctor_first_name": fn,
                "doctor_last_name": ln,
            }
            for q in questions
        ],
    }


@router.put("/update-main-question/{question_id}")
@router.put("/update-doctor-main-question/{question_id}")
async def update_main_question(
    question_id: str,
    payload: DoctorMainQuestionUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    q = await session.get(DoctorMainQuestion, question_id)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    _require_staff_or_self_doctor(current_user, q.doctor_id)

    data = payload.model_dump(exclude_unset=True)
    if current_user.role_as == 3 and "doctor_id" in data:
        data.pop("doctor_id", None)

    for k, v in data.items():
        setattr(q, k, v)
    q.updated_at = datetime.utcnow()

    session.add(q)
    await session.commit()
    await session.refresh(q)

    return {"status": 200, "message": "Main question updated successfully", "question": q.model_dump()}


@router.delete("/delete-main-question/{question_id}")
@router.delete("/delete-doctor-main-question/{question_id}")
async def delete_main_question(
    question_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    q = await session.get(DoctorMainQuestion, question_id)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    _require_staff_or_self_doctor(current_user, q.doctor_id)

    # Delete answers first
    ans_res = await session.exec(select(DoctorMainQuestionAnswer).where(DoctorMainQuestionAnswer.question_id == question_id))
    for a in ans_res.all() or []:
        await session.delete(a)

    await session.delete(q)
    await session.commit()

    return {"status": 200, "message": "The question has been deleted!"}


@router.get("/get-question-answers/{question_id}")
async def get_question_answers(
    question_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    q = await session.get(DoctorMainQuestion, question_id)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    # Anyone logged in can view answer options
    res = await session.exec(
        select(DoctorMainQuestionAnswer).where(DoctorMainQuestionAnswer.question_id == question_id)
    )
    answers = res.all() or []
    return {
        "status": 200,
        "question_answers": [a.model_dump() for a in answers],
    }


@router.post("/add-question-answer")
async def add_question_answer(
    payload: DoctorMainQuestionAnswerCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    q = await session.get(DoctorMainQuestion, payload.question_id)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    _require_staff_or_self_doctor(current_user, q.doctor_id)

    ans = DoctorMainQuestionAnswer(question_id=payload.question_id, answer=payload.answer)
    session.add(ans)
    await session.commit()
    await session.refresh(ans)

    return {"status": 200, "message": "Answer saved successfully", "answer": ans.model_dump()}


@router.delete("/delete-question-answer/{answer_id}")
async def delete_question_answer(
    answer_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    ans = await session.get(DoctorMainQuestionAnswer, answer_id)
    if not ans:
        raise HTTPException(status_code=404, detail="Answer not found")

    q = await session.get(DoctorMainQuestion, ans.question_id)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    _require_staff_or_self_doctor(current_user, q.doctor_id)

    await session.delete(ans)
    await session.commit()
    return {"status": 200, "message": "Answer deleted successfully"}
