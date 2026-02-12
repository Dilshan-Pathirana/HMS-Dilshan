"""Consultation business logic – Patch 4.0

State machine: queue → in_progress → awaiting_opinion → completed → payment_pending → paid → medicines_issued
Auto-link to appointment, generate audit logs, second opinions, auto-summary, pharmacy dispensing.
"""
from __future__ import annotations

import json
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
    DoctorOpinion,
    IssuedMedicine,
    QuestionBank,
)
from app.models.appointment import Appointment
from app.models.nurse_domain import VitalSign
from app.models.patient import Patient
from app.models.doctor import Doctor


class ConsultationService:
    """Encapsulates consultation lifecycle."""

    # ============================================================
    # Core lifecycle
    # ============================================================

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
        clinical_notes: Optional[str] = None,
        follow_up_instructions: Optional[str] = None,
        consultation_fee: Optional[float] = None,
    ) -> Consultation:
        c = await session.get(Consultation, consultation_id)
        if not c:
            raise HTTPException(404, "Consultation not found")
        if c.status in ("completed", "paid", "medicines_issued"):
            raise HTTPException(400, "Consultation already finalized")

        c.status = "completed"
        c.completed_at = datetime.utcnow()
        if notes:
            c.notes = notes
        if clinical_notes:
            c.clinical_notes = clinical_notes
        if follow_up_instructions:
            c.follow_up_instructions = follow_up_instructions
        if consultation_fee is not None:
            c.consultation_fee = consultation_fee
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
    async def update_status(
        session: AsyncSession,
        consultation_id: str,
        new_status: str,
    ) -> Consultation:
        c = await session.get(Consultation, consultation_id)
        if not c:
            raise HTTPException(404, "Consultation not found")
        c.status = new_status
        session.add(c)
        await session.commit()
        await session.refresh(c)
        return c

    # ============================================================
    # Queue (enhanced with nurse_assessment_status)
    # ============================================================

    @staticmethod
    async def get_queue(session: AsyncSession, doctor_id: str, appt_date: Optional[date] = None):
        d = appt_date or date.today()
        q = select(Appointment).where(
            Appointment.doctor_id == doctor_id,
            Appointment.appointment_date == d,
            Appointment.status.in_(["confirmed", "in_progress", "pending"]),
        ).order_by(Appointment.appointment_time)  # type: ignore
        result = await session.exec(q)
        appointments = list(result.all())

        # Enrich each appointment with nurse assessment info + patient name
        enriched = []
        for appt in appointments:
            data = appt.model_dump()
            # Fetch patient name
            patient = await session.get(Patient, appt.patient_id) if appt.patient_id else None
            if patient:
                from app.models.user import User
                user = await session.get(User, patient.user_id)
                data["patient_name"] = f"{user.first_name} {user.last_name}" if user else "Unknown"
            else:
                data["patient_name"] = "Unknown"

            # Determine queue status colour
            if appt.status == "in_progress":
                data["queue_status"] = "in_consultation"
                data["queue_color"] = "blue"
            elif getattr(appt, "nurse_assessment_status", None) == "completed":
                data["queue_status"] = "ready_for_doctor"
                data["queue_color"] = "green"
            else:
                data["queue_status"] = "waiting_nurse"
                data["queue_color"] = "yellow"

            enriched.append(data)
        return enriched

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

    # ============================================================
    # Question Bank
    # ============================================================

    @staticmethod
    async def get_question_bank(
        session: AsyncSession,
        category: Optional[str] = None,
    ) -> List[QuestionBank]:
        q = select(QuestionBank).order_by(QuestionBank.display_order)  # type: ignore
        if category:
            q = q.where(QuestionBank.category == category)
        result = await session.exec(q)
        return list(result.all())

    # ============================================================
    # Second Opinion
    # ============================================================

    @staticmethod
    async def request_second_opinion(
        session: AsyncSession,
        consultation_id: str,
        requesting_doctor_id: str,
        reviewing_doctor_id: str,
    ) -> DoctorOpinion:
        c = await session.get(Consultation, consultation_id)
        if not c:
            raise HTTPException(404, "Consultation not found")

        c.requires_second_opinion = True
        c.second_opinion_doctor_id = reviewing_doctor_id
        c.second_opinion_status = "pending"
        c.status = "awaiting_opinion"
        session.add(c)

        opinion = DoctorOpinion(
            consultation_id=consultation_id,
            requesting_doctor_id=requesting_doctor_id,
            reviewing_doctor_id=reviewing_doctor_id,
            status="pending",
        )
        session.add(opinion)
        await session.commit()
        await session.refresh(opinion)
        return opinion

    @staticmethod
    async def respond_to_opinion(
        session: AsyncSession,
        opinion_id: str,
        status: str,  # approved / rejected / commented
        comment: Optional[str] = None,
        suggestion: Optional[str] = None,
    ) -> DoctorOpinion:
        opinion = await session.get(DoctorOpinion, opinion_id)
        if not opinion:
            raise HTTPException(404, "Opinion request not found")
        if opinion.status != "pending":
            raise HTTPException(400, "Opinion already responded to")

        opinion.status = status
        opinion.comment = comment
        opinion.suggestion = suggestion
        opinion.responded_at = datetime.utcnow()
        session.add(opinion)

        # Update consultation
        c = await session.get(Consultation, opinion.consultation_id)
        if c:
            c.second_opinion_status = status
            c.second_opinion_comment = comment or suggestion
            if status in ("approved", "rejected", "commented"):
                c.status = "in_progress"  # return to doctor
            session.add(c)

        await session.commit()
        await session.refresh(opinion)
        return opinion

    @staticmethod
    async def get_opinions_for_consultation(
        session: AsyncSession,
        consultation_id: str,
    ) -> List[DoctorOpinion]:
        result = await session.exec(
            select(DoctorOpinion).where(DoctorOpinion.consultation_id == consultation_id)
        )
        return list(result.all())

    @staticmethod
    async def get_pending_opinions_for_doctor(
        session: AsyncSession,
        doctor_id: str,
    ) -> List[DoctorOpinion]:
        result = await session.exec(
            select(DoctorOpinion).where(
                DoctorOpinion.reviewing_doctor_id == doctor_id,
                DoctorOpinion.status == "pending",
            )
        )
        return list(result.all())

    # ============================================================
    # Nurse Vitals for a consultation
    # ============================================================

    @staticmethod
    async def get_vitals_for_appointment(
        session: AsyncSession,
        appointment_id: str,
    ) -> Optional[VitalSign]:
        result = await session.exec(
            select(VitalSign).where(VitalSign.appointment_id == appointment_id)
            .order_by(VitalSign.recorded_at.desc())  # type: ignore
        )
        return result.first()

    @staticmethod
    async def get_latest_vitals_for_patient(
        session: AsyncSession,
        patient_id: str,
    ) -> Optional[VitalSign]:
        result = await session.exec(
            select(VitalSign).where(VitalSign.patient_id == patient_id)
            .order_by(VitalSign.recorded_at.desc())  # type: ignore
        )
        return result.first()

    # ============================================================
    # Auto-Summary (generates from Q&A answers)
    # ============================================================

    @staticmethod
    async def generate_auto_summary(
        session: AsyncSession,
        consultation_id: str,
    ) -> dict:
        """Generate summary by grouping Q&A answers by category."""
        c = await session.get(Consultation, consultation_id)
        if not c:
            raise HTTPException(404, "Consultation not found")

        result = await session.exec(
            select(ConsultationQuestion)
            .where(ConsultationQuestion.consultation_id == consultation_id)
            .order_by(ConsultationQuestion.display_order)  # type: ignore
        )
        questions = list(result.all())

        # Group answers by category
        categories = {}
        for q in questions:
            cat = q.category or "general"
            if cat not in categories:
                categories[cat] = []
            if q.answer_text:
                categories[cat].append(f"{q.question_text}: {q.answer_text}")

        symptom_summary = "; ".join(categories.get("general_symptoms", []))
        modalities = "; ".join(categories.get("modalities", []))
        mental_emotional = "; ".join(categories.get("mental_state", []))
        physical_generals = "; ".join(categories.get("physical_symptoms", []))

        # Build keynotes from all answered questions
        all_answers = []
        for cat_answers in categories.values():
            all_answers.extend(cat_answers)
        keynotes = "; ".join(all_answers[:10])  # top 10 as keynote summary

        # Save to consultation
        c.symptom_summary = symptom_summary or None
        c.modalities = modalities or None
        c.mental_emotional = mental_emotional or None
        c.physical_generals = physical_generals or None
        c.keynotes = keynotes or None
        session.add(c)
        await session.commit()
        await session.refresh(c)

        return {
            "symptom_summary": symptom_summary,
            "modalities": modalities,
            "mental_emotional": mental_emotional,
            "physical_generals": physical_generals,
            "keynotes": keynotes,
        }

    # ============================================================
    # Pharmacy – issue medicines
    # ============================================================

    @staticmethod
    async def issue_medicine(
        session: AsyncSession,
        data: dict,
    ) -> IssuedMedicine:
        med = IssuedMedicine(**data)
        session.add(med)
        await session.commit()
        await session.refresh(med)
        return med

    @staticmethod
    async def get_issued_medicines(
        session: AsyncSession,
        consultation_id: str,
    ) -> List[IssuedMedicine]:
        result = await session.exec(
            select(IssuedMedicine).where(IssuedMedicine.consultation_id == consultation_id)
        )
        return list(result.all())

    @staticmethod
    async def mark_medicines_issued(
        session: AsyncSession,
        consultation_id: str,
        pharmacist_user_id: str,
    ) -> Consultation:
        c = await session.get(Consultation, consultation_id)
        if not c:
            raise HTTPException(404, "Consultation not found")
        c.medicines_issued_at = datetime.utcnow()
        c.medicines_issued_by = pharmacist_user_id
        c.status = "medicines_issued"
        session.add(c)
        await session.commit()
        await session.refresh(c)
        return c

    @staticmethod
    async def collect_payment(
        session: AsyncSession,
        consultation_id: str,
        collected_by: str,
        fee: Optional[float] = None,
    ) -> Consultation:
        c = await session.get(Consultation, consultation_id)
        if not c:
            raise HTTPException(404, "Consultation not found")
        c.payment_collected_at = datetime.utcnow()
        c.payment_collected_by = collected_by
        if fee is not None:
            c.consultation_fee = fee
        c.status = "paid"
        session.add(c)
        await session.commit()
        await session.refresh(c)
        return c

    @staticmethod
    async def get_pharmacy_queue(
        session: AsyncSession,
        branch_id: Optional[str] = None,
    ):
        """Get consultations that have prescriptions and are completed/paid but medicines not issued."""
        q = select(Consultation).where(
            Consultation.status.in_(["completed", "paid"]),
            Consultation.medicines_issued_at == None,  # noqa: E711
        )
        if branch_id:
            q = q.where(Consultation.branch_id == branch_id)
        q = q.order_by(Consultation.completed_at.desc())  # type: ignore
        result = await session.exec(q)
        consultations = list(result.all())

        # Only include consultations that have prescriptions
        enriched = []
        for c in consultations:
            rx_result = await session.exec(
                select(ConsultationPrescription).where(
                    ConsultationPrescription.consultation_id == c.id
                )
            )
            prescriptions = list(rx_result.all())
            if prescriptions:
                patient = await session.get(Patient, c.patient_id)
                patient_name = "Unknown"
                if patient:
                    from app.models.user import User
                    user = await session.get(User, patient.user_id)
                    patient_name = f"{user.first_name} {user.last_name}" if user else "Unknown"

                enriched.append({
                    **c.model_dump(),
                    "patient_name": patient_name,
                    "prescriptions": [p.model_dump() for p in prescriptions],
                })
        return enriched

    # ============================================================
    # Sub-item helpers (existing)
    # ============================================================

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

    # ============================================================
    # Monitoring / Stats for admin dashboards
    # ============================================================

    @staticmethod
    async def get_monitoring_stats(
        session: AsyncSession,
        branch_id: Optional[str] = None,
        stat_date: Optional[date] = None,
    ) -> dict:
        """Aggregate consultation pipeline stats for admin monitoring."""
        from app.models.appointment import Appointment
        from app.models.nurse_domain import VitalSign
        from app.models.user import User

        target_date = stat_date or date.today()

        # ── base filter ──
        def branch_filter(q, model=Consultation):
            if branch_id:
                q = q.where(model.branch_id == branch_id)
            return q

        # 1. Today's consultations by status
        status_q = (
            select(Consultation.status, func.count(Consultation.id))
            .where(func.date(Consultation.started_at) == target_date)
            .group_by(Consultation.status)
        )
        status_q = branch_filter(status_q)
        status_result = await session.exec(status_q)
        status_counts = {row[0]: row[1] for row in status_result.all()}

        total_today = sum(status_counts.values())
        completed_today = status_counts.get("completed", 0) + status_counts.get("paid", 0) + status_counts.get("medicines_issued", 0)
        in_progress_today = status_counts.get("in_progress", 0) + status_counts.get("awaiting_opinion", 0)

        # 2. Nurse assessments today
        nurse_assessed_q = (
            select(func.count(Appointment.id))
            .where(
                Appointment.appointment_date == target_date,
                Appointment.nurse_assessment_status == "completed",
            )
        )
        if branch_id:
            nurse_assessed_q = nurse_assessed_q.where(Appointment.branch_id == branch_id)
        nurse_assessed = (await session.exec(nurse_assessed_q)).one() or 0

        # 3. Pending pharmacy (prescriptions written but not dispensed)
        pharmacy_pending_q = (
            select(func.count(Consultation.id))
            .where(
                Consultation.status.in_(["completed", "paid"]),
                Consultation.medicines_issued_at == None,  # noqa: E711
            )
        )
        pharmacy_pending_q = branch_filter(pharmacy_pending_q)
        pharmacy_pending = (await session.exec(pharmacy_pending_q)).one() or 0

        # 4. Medicines issued today
        issued_today_q = (
            select(func.count(Consultation.id))
            .where(
                Consultation.medicines_issued_at != None,  # noqa: E711
                func.date(Consultation.medicines_issued_at) == target_date,
            )
        )
        issued_today_q = branch_filter(issued_today_q)
        issued_today = (await session.exec(issued_today_q)).one() or 0

        # 5. Second opinions today (pending)
        from app.models.consultation import DoctorOpinion
        pending_opinions_q = (
            select(func.count(DoctorOpinion.id))
            .where(DoctorOpinion.status == "pending")
        )
        pending_opinions = (await session.exec(pending_opinions_q)).one() or 0

        # 6. Revenue today from consultation fees
        revenue_q = (
            select(func.coalesce(func.sum(Consultation.consultation_fee), 0))
            .where(
                Consultation.payment_collected_at != None,  # noqa: E711
                func.date(Consultation.payment_collected_at) == target_date,
            )
        )
        revenue_q = branch_filter(revenue_q)
        revenue_today = float((await session.exec(revenue_q)).one() or 0)

        # 7. Average consultation duration (minutes) today
        from sqlalchemy import text as sa_text
        duration_q = (
            select(
                func.avg(
                    func.timestampdiff(
                        sa_text("MINUTE"),
                        Consultation.started_at,
                        Consultation.completed_at,
                    )
                )
            )
            .where(
                Consultation.completed_at != None,  # noqa: E711
                func.date(Consultation.started_at) == target_date,
            )
        )
        duration_q = branch_filter(duration_q)
        avg_duration_raw = (await session.exec(duration_q)).one()
        avg_duration = round(float(avg_duration_raw), 1) if avg_duration_raw else 0.0

        # 8. Recent consultations (last 20)
        recent_q = (
            select(Consultation)
            .order_by(Consultation.started_at.desc())  # type: ignore
            .limit(20)
        )
        recent_q = branch_filter(recent_q)
        recent_result = await session.exec(recent_q)
        recents_raw = list(recent_result.all())

        recent_consultations = []
        for c in recents_raw:
            patient_name = "Unknown"
            doctor_name = "Unknown"
            try:
                patient = await session.get(Patient, c.patient_id)
                if patient:
                    u = await session.get(User, patient.user_id)
                    if u:
                        patient_name = f"{u.first_name} {u.last_name}"
                doctor = await session.get(Doctor, c.doctor_id)
                if doctor:
                    u2 = await session.get(User, doctor.user_id)
                    if u2:
                        doctor_name = f"Dr. {u2.first_name} {u2.last_name}"
            except Exception:
                pass
            recent_consultations.append({
                "id": c.id,
                "patient_name": patient_name,
                "doctor_name": doctor_name,
                "status": c.status,
                "started_at": c.started_at.isoformat() if c.started_at else None,
                "completed_at": c.completed_at.isoformat() if c.completed_at else None,
                "consultation_fee": c.consultation_fee,
                "medicines_issued_at": c.medicines_issued_at.isoformat() if c.medicines_issued_at else None,
                "requires_second_opinion": c.requires_second_opinion,
            })

        return {
            "date": target_date.isoformat(),
            "summary": {
                "total_today": total_today,
                "completed_today": completed_today,
                "in_progress": in_progress_today,
                "nurse_assessed": nurse_assessed,
                "pharmacy_pending": pharmacy_pending,
                "issued_today": issued_today,
                "pending_opinions": pending_opinions,
                "revenue_today": revenue_today,
                "avg_duration_minutes": avg_duration,
            },
            "status_breakdown": status_counts,
            "recent_consultations": recent_consultations,
        }
