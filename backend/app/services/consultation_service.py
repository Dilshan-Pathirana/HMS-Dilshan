"""Consultation business logic – Patch 3.1

State machine: queue → in_progress → completed
Auto-link to appointment, generate audit logs.
"""
from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional

from fastapi import HTTPException
from sqlmodel import select, func
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.consultation import (
    Consultation,
    ConsultationDiagnosis,
    ConsultationPrescription,
    ConsultationQuestion,
    Investigation,
)
from app.models.appointment import Appointment
from app.models.patient import Patient
from app.models.doctor import Doctor


class ConsultationService:
    """Encapsulates consultation lifecycle."""

    @staticmethod
    async def start(
        session: AsyncSession,
        doctor_id: str,
        patient_id: str,
        branch_id: str,
        appointment_id: Optional[str] = None,
        chief_complaint: Optional[str] = None,
    ) -> Consultation:
        # If appointment given, mark it in_progress
        if appointment_id:
            appt = await session.get(Appointment, appointment_id)
            if appt and appt.status in ("confirmed", "pending"):
                appt.status = "in_progress"
                appt.consultation_start = datetime.utcnow()
                session.add(appt)

        consultation = Consultation(
            appointment_id=appointment_id,
            doctor_id=doctor_id,
            patient_id=patient_id,
            branch_id=branch_id,
            chief_complaint=chief_complaint,
            status="in_progress",
        )
        session.add(consultation)
        await session.commit()
        await session.refresh(consultation)
        return consultation

    @staticmethod
    async def get(session: AsyncSession, consultation_id: str) -> Consultation:
        c = await session.get(Consultation, consultation_id)
        if not c:
            raise HTTPException(404, "Consultation not found")
        return c

    @staticmethod
    async def submit(
        session: AsyncSession,
        consultation_id: str,
        notes: Optional[str] = None,
    ) -> Consultation:
        c = await session.get(Consultation, consultation_id)
        if not c:
            raise HTTPException(404, "Consultation not found")
        if c.status == "completed":
            raise HTTPException(400, "Consultation already completed")

        c.status = "completed"
        c.completed_at = datetime.utcnow()
        if notes:
            c.notes = notes
        session.add(c)

        # Also complete linked appointment
        if c.appointment_id:
            appt = await session.get(Appointment, c.appointment_id)
            if appt and appt.status == "in_progress":
                appt.status = "completed"
                appt.consultation_end = datetime.utcnow()
                session.add(appt)

        await session.commit()
        await session.refresh(c)
        return c

    @staticmethod
    async def get_queue(session: AsyncSession, doctor_id: str, appt_date: Optional[date] = None):
        d = appt_date or date.today()
        q = select(Appointment).where(
            Appointment.doctor_id == doctor_id,
            Appointment.appointment_date == d,
            Appointment.status.in_(["confirmed", "in_progress"]),
        ).order_by(Appointment.appointment_time)  # type: ignore
        result = await session.exec(q)
        return list(result.all())

    @staticmethod
    async def get_patient_history(session: AsyncSession, patient_id: str, limit: int = 20):
        q = (
            select(Consultation)
            .where(Consultation.patient_id == patient_id)
            .order_by(Consultation.started_at.desc())  # type: ignore
            .limit(limit)
        )
        result = await session.exec(q)
        return list(result.all())

    # ---------- Sub-item helpers ----------

    @staticmethod
    async def add_diagnosis(session: AsyncSession, data: dict) -> ConsultationDiagnosis:
        diag = ConsultationDiagnosis(**data)
        session.add(diag)
        await session.commit()
        await session.refresh(diag)
        return diag

    @staticmethod
    async def get_diagnoses(session: AsyncSession, consultation_id: str) -> List[ConsultationDiagnosis]:
        result = await session.exec(
            select(ConsultationDiagnosis).where(ConsultationDiagnosis.consultation_id == consultation_id)
        )
        return list(result.all())

    @staticmethod
    async def add_prescription(session: AsyncSession, data: dict) -> ConsultationPrescription:
        rx = ConsultationPrescription(**data)
        session.add(rx)
        await session.commit()
        await session.refresh(rx)
        return rx

    @staticmethod
    async def get_prescriptions(session: AsyncSession, consultation_id: str) -> List[ConsultationPrescription]:
        result = await session.exec(
            select(ConsultationPrescription).where(ConsultationPrescription.consultation_id == consultation_id)
        )
        return list(result.all())

    @staticmethod
    async def add_question(session: AsyncSession, data: dict) -> ConsultationQuestion:
        qa = ConsultationQuestion(**data)
        session.add(qa)
        await session.commit()
        await session.refresh(qa)
        return qa

    @staticmethod
    async def get_questions(session: AsyncSession, consultation_id: str) -> List[ConsultationQuestion]:
        result = await session.exec(
            select(ConsultationQuestion).where(ConsultationQuestion.consultation_id == consultation_id)
        )
        return list(result.all())

    @staticmethod
    async def add_investigation(session: AsyncSession, data: dict) -> Investigation:
        inv = Investigation(**data)
        session.add(inv)
        await session.commit()
        await session.refresh(inv)
        return inv

    @staticmethod
    async def get_investigations(session: AsyncSession, consultation_id: str) -> List[Investigation]:
        result = await session.exec(
            select(Investigation).where(Investigation.consultation_id == consultation_id)
        )
        return list(result.all())
