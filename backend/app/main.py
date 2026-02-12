from fastapi import FastAPI, Request, Depends, HTTPException
from datetime import datetime
from app.api import auth, users, branches, doctors, patients, receptionist, pharmacies, pharmacist, super_admin, nurse, staff, appointments, schedules, uploads
from app.api import super_admin_appointments
from app.api import doctor_main_questions
from app.api import patient_appointments, doctor_appointments, admin_appointments, patient_dashboard, consultation, pharmacy_inventory, notifications, pos, hrm_leave, hrm_salary, hrm_shift, hrm_admin, hrm_super_admin, branch_admin, purchase_requests, medical_insights, doctor_sessions, chatbot, sms, payments, email, websocket_alerts, dashboard_stats, website, patient_sessions
from app.api import super_admin_pos, legacy_pos_pharmacy
import traceback
import sys
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.database import get_session
from app.models.user import User
from app.api.deps import get_current_user
from app.core.config import settings

app = FastAPI(
    title="HMS API",
    description="Hospital Management System API with FastAPI and MySQL",
    version="1.0.0"
)

from fastapi.exceptions import RequestValidationError

# Global Exception Handlers

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Build a field-keyed errors dict for the frontend
    field_errors: dict[str, str] = {}
    for err in exc.errors():
        loc = err.get("loc", [])
        # loc is e.g. ("body", "first_name") — take the last element as field name
        field = str(loc[-1]) if loc else "unknown"
        if field == "body":
            field = "unknown"
        msg = err.get("msg", "Invalid value")
        # Strip Pydantic prefix "Value error, " if present
        if msg.startswith("Value error, "):
            msg = msg[len("Value error, "):]
        field_errors.setdefault(field, msg)

    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "detail": "Validation Error",
            "errors": field_errors,
        },
    )

@app.exception_handler(Exception)
async def log_exception_handler(request: Request, exc: Exception):
    print("\n--- Unhandled Exception ---", file=sys.stderr)
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "error_type": type(exc).__name__, "error_message": str(exc)},
    )

# CORS Configuration
origins = [
    "http://localhost:5173",  # React Dev Server
    "http://localhost:3000",
    "http://localhost",
    "http://13.233.254.140",  # AWS EC2 Production
    "http://13.233.254.140:80",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"DEBUG: Middleware received request: {request.method} {request.url.path}", flush=True)
    response = await call_next(request)
    print(f"DEBUG: Middleware response status: {response.status_code}", flush=True)
    return response

# Static file serving for uploads
import os
from fastapi.staticfiles import StaticFiles
uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

app.include_router(uploads.router, prefix="/api/v1/uploads", tags=["uploads"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(branches.router, prefix="/api/v1/branches", tags=["branches"])
app.include_router(doctors.router, prefix="/api/v1/doctors", tags=["doctors"])
app.include_router(patients.router, prefix="/api/v1/patients", tags=["patients"])
app.include_router(appointments.router, prefix="/api/v1/appointments", tags=["appointments"])
app.include_router(appointments.availability_router, prefix="/api/v1", tags=["availability"])
app.include_router(receptionist.router, prefix="/api/v1/receptionist", tags=["receptionist"])
app.include_router(pharmacies.router, prefix="/api/v1/pharmacies", tags=["pharmacies"])
app.include_router(pharmacies.router, prefix="/api/v1/pharmacy", tags=["pharmacy"])
app.include_router(pharmacist.router, prefix="/api/v1/pharmacist", tags=["pharmacist"])
app.include_router(nurse.router, prefix="/api/v1/nurse", tags=["nurse"])
app.include_router(staff.router, prefix="/api/v1/users", tags=["staff"])
app.include_router(super_admin.router, prefix="/api/v1/super-admin", tags=["super-admin"])
app.include_router(super_admin_appointments.router, prefix="/api/v1/super-admin/appointments", tags=["super-admin-appointments"])
app.include_router(doctor_main_questions.router, prefix="/api/v1", tags=["doctor-main-questions"])
app.include_router(schedules.router, prefix="/api/v1/schedules", tags=["schedules"])
app.include_router(patient_appointments.router, prefix="/api/v1/patient/appointments", tags=["patient-appointments"])
app.include_router(doctor_appointments.router, prefix="/api/v1/doctor/appointments", tags=["doctor-appointments"])
app.include_router(admin_appointments.router, prefix="/api/v1/branch-admin/appointments", tags=["admin-appointments"])
app.include_router(patient_dashboard.router, prefix="/api/v1/patient", tags=["patient-dashboard"])
app.include_router(consultation.router, prefix="/api/v1/consultation", tags=["consultation"])
app.include_router(pharmacy_inventory.router, prefix="/api/v1/pharmacy-inventory", tags=["pharmacy-inventory"])
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["notifications"])
app.include_router(pos.router, prefix="/api/v1/pos", tags=["pos"])
app.include_router(super_admin_pos.router, prefix="/api/v1/super-admin/pos", tags=["super-admin-pos"])
app.include_router(super_admin_pos.enhanced_router, prefix="/api/v1/super-admin/enhanced-pos", tags=["super-admin-pos"])
app.include_router(legacy_pos_pharmacy.router, prefix="/api/v1/api", tags=["legacy-pos-pharmacy"])
app.include_router(hrm_leave.router, prefix="/api/v1/hrm", tags=["hrm-leave"])
app.include_router(hrm_salary.router, prefix="/api/v1/hrm", tags=["hrm-salary"])
app.include_router(hrm_shift.router, prefix="/api/v1/hrm", tags=["hrm-shift"])
app.include_router(hrm_admin.router, prefix="/api/v1/hrm", tags=["hrm-admin"])
app.include_router(hrm_super_admin.router, prefix="/api/v1/hrm/super-admin", tags=["hrm-super-admin"])
app.include_router(branch_admin.router, prefix="/api/v1/branch-admin", tags=["branch-admin-mgmt"])
app.include_router(purchase_requests.router, prefix="/api/v1", tags=["purchase-requests"])
app.include_router(medical_insights.router, prefix="/api/v1/medical-insights", tags=["medical-insights"])
app.include_router(doctor_sessions.router, prefix="/api/v1/doctor", tags=["doctor-sessions"])
app.include_router(patient_sessions.router, prefix="/api/v1", tags=["patient-sessions"])
app.include_router(chatbot.router, prefix="/api/v1/chatbot", tags=["chatbot"])
app.include_router(chatbot.router, prefix="/api/v1/api/chatbot", tags=["chatbot-legacy"])
app.include_router(sms.router, prefix="/api/v1/sms", tags=["sms"])
app.include_router(payments.router, prefix="/api/v1/payments", tags=["payments"])
app.include_router(email.router, prefix="/api/v1/email", tags=["email"])
app.include_router(websocket_alerts.router, tags=["websocket"])
app.include_router(dashboard_stats.router, prefix="/api/v1", tags=["dashboard-stats"])
app.include_router(website.router, prefix="/api/v1", tags=["website-settings"])


# ──── Legacy supplier delete route ────
@app.delete("/api/v1/delete-supplier/{supplier_id}", tags=["pharmacies"])
async def delete_supplier_compat(
    supplier_id: str,
    session: AsyncSession = Depends(get_session),
):
    from app.models.pharmacy_inventory import Supplier as SupplierModel
    supplier = await session.get(SupplierModel, supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    supplier.is_active = False
    session.add(supplier)
    await session.commit()
    return {"success": True, "status": 200, "message": "Supplier deleted successfully"}


@app.get("/api/v1/get-branches")
@app.get("/api/v1/api/get-branches")
async def get_branches_compat(session: AsyncSession = Depends(get_session)):
    """Compatibility endpoint used by multiple frontend modules."""
    from app.models.branch import Branch
    from app.models.doctor_schedule import DoctorSchedule
    from sqlmodel import col
    from sqlmodel import col, select

    result = await session.exec(select(Branch).order_by(Branch.center_name))
    items = result.all() or []
    return {
        "status": 200,
        "branches": [
            {
                "id": b.id,
                "center_name": b.center_name,
                "division": b.division,
            }
            for b in items
        ],
    }


@app.get("/api/v1/get-patient-appointments/{user_id}")
async def get_patient_appointments_compat(
    user_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Compatibility endpoint for patient dashboard appointment lists."""
    if current_user.role_as != 1 and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not enough privileges")

    from sqlmodel import col, select
    from app.models.patient import Patient
    from app.models.appointment import Appointment
    from app.models.doctor import Doctor
    from app.models.branch import Branch
    from app.models.doctor_schedule import DoctorSchedule

    patient_res = await session.exec(select(Patient).where(Patient.user_id == user_id))
    patient = patient_res.first()
    if not patient:
        return {"status": 200, "appointments": []}

    appt_res = await session.exec(select(Appointment).where(Appointment.patient_id == patient.id))
    appts = appt_res.all() or []
    if not appts:
        return {"status": 200, "appointments": []}

    doctor_ids = {a.doctor_id for a in appts}
    branch_ids = {a.branch_id for a in appts}

    doctor_map = {}
    branch_map = {}
    schedule_map = {}
    if doctor_ids:
        doctor_res = await session.exec(select(Doctor).where(Doctor.id.in_(doctor_ids)))
        doctor_map = {d.id: d for d in doctor_res.all()}
    if branch_ids:
        branch_res = await session.exec(select(Branch).where(Branch.id.in_(branch_ids)))
        branch_map = {b.id: b for b in branch_res.all()}
    schedule_ids = {a.schedule_id for a in appts if a.schedule_id}
    if schedule_ids:
        schedule_res = await session.exec(select(DoctorSchedule).where(col(DoctorSchedule.id).in_(schedule_ids)))
        schedule_map = {s.id: s for s in schedule_res.all()}

    user = await session.get(User, user_id)
    appointments = []
    for appt in appts:
        doctor = doctor_map.get(appt.doctor_id)
        branch = branch_map.get(appt.branch_id)
        slot_number = appt.queue_number or 0
        schedule = schedule_map.get(appt.schedule_id) if appt.schedule_id else None
        if schedule and appt.appointment_time:
            start_dt = datetime.combine(datetime.min.date(), schedule.start_time)
            appt_dt = datetime.combine(datetime.min.date(), appt.appointment_time)
            delta_minutes = int((appt_dt - start_dt).total_seconds() // 60)
            if delta_minutes >= 0 and schedule.slot_duration_minutes > 0:
                slot_number = (delta_minutes // schedule.slot_duration_minutes) + 1

        appointments.append(
            {
                "id": appt.id,
                "patient_first_name": user.first_name if user else "",
                "patient_last_name": user.last_name if user else "",
                "phone": user.contact_number_mobile if user else None,
                "NIC": user.nic_number if user else None,
                "email": user.email if user else None,
                "doctor_first_name": doctor.first_name if doctor else "",
                "doctor_last_name": doctor.last_name if doctor else "",
                "doctor_id": appt.doctor_id,
                "areas_of_specialization": doctor.specialization if doctor else "",
                "center_name": branch.center_name if branch else "",
                "date": appt.appointment_date,
                "start_time": appt.appointment_time.strftime("%H:%M") if appt.appointment_time else None,
                "slot": slot_number,
                "branch_id": appt.branch_id,
                "schedule_id": appt.schedule_id,
                "user_id": user_id,
                "address": patient.address,
                "reschedule_count": appt.reschedule_count if hasattr(appt, 'reschedule_count') else 0,
                "status": appt.status,
                "branch_name": branch.center_name if branch else "",
            }
        )

    return {"status": 200, "appointments": appointments}


def _doctor_disease_payload(disease, doctor_user: User) -> dict:
    first_name = doctor_user.first_name or "Unknown"
    last_name = doctor_user.last_name or "Doctor"
    return {
        "id": disease.id,
        "doctor_id": disease.doctor_id,
        "disease_name": disease.disease_name,
        "description": disease.description,
        "priority": None,
        "doctor_first_name": first_name,
        "doctor_last_name": last_name,
    }


@app.get("/api/v1/get-all-doctor-disease")
@app.get("/api/v1/api/get-all-doctor-disease")
async def get_all_doctor_disease_compat(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    from app.models.doctor_session import DoctorCreatedDisease
    from sqlmodel import select

    query = select(DoctorCreatedDisease).where(DoctorCreatedDisease.doctor_id == current_user.id)
    result = await session.exec(query)
    items = result.all() or []
    return {
        "status": 200,
        "doctor_diseases": [_doctor_disease_payload(d, current_user) for d in items],
    }


@app.post("/api/v1/create-doctor-disease")
@app.post("/api/v1/api/create-doctor-disease")
async def create_doctor_disease_compat(
    payload: dict,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    from app.models.doctor_session import DoctorCreatedDisease

    disease = DoctorCreatedDisease(
        doctor_id=current_user.id,
        disease_name=payload.get("disease_name", ""),
        description=payload.get("description"),
        symptoms=payload.get("symptoms"),
    )
    session.add(disease)
    await session.commit()
    await session.refresh(disease)
    return {
        "status": 200,
        "message": "Doctor disease created successfully.",
        "doctor_disease": _doctor_disease_payload(disease, current_user),
    }


@app.put("/api/v1/update-doctor-disease/{disease_id}")
@app.put("/api/v1/api/update-doctor-disease/{disease_id}")
async def update_doctor_disease_compat(
    disease_id: str,
    payload: dict,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    from app.models.doctor_session import DoctorCreatedDisease

    disease = await session.get(DoctorCreatedDisease, disease_id)
    if not disease or disease.doctor_id != current_user.id:
        raise HTTPException(status_code=404, detail="Disease not found")

    for key in ("disease_name", "description", "symptoms"):
        if key in payload:
            setattr(disease, key, payload[key])

    session.add(disease)
    await session.commit()
    await session.refresh(disease)
    return {
        "status": 200,
        "message": "Disease updated successfully.",
        "doctor_disease": _doctor_disease_payload(disease, current_user),
    }


@app.delete("/api/v1/delete-doctor-disease/{disease_id}")
@app.delete("/api/v1/api/delete-doctor-disease/{disease_id}")
async def delete_doctor_disease_compat(
    disease_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    from app.models.doctor_session import DoctorCreatedDisease

    disease = await session.get(DoctorCreatedDisease, disease_id)
    if not disease or disease.doctor_id != current_user.id:
        raise HTTPException(status_code=404, detail="Disease not found")

    await session.delete(disease)
    await session.commit()
    return {
        "status": 200,
        "message": "Disease deleted successfully.",
    }


def _is_super_admin(user: User) -> bool:
    # Matches checks used across the codebase (role_as == 1)
    return getattr(user, "role_as", None) == 1 or getattr(user, "role", None) == "super_admin"


@app.get("/api/v1/api/super-admin/chatbot/faqs")
async def legacy_super_admin_chatbot_faqs_list(
    category: str | None = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Legacy endpoint consumed by SuperAdminChatbotManagement page."""
    if not _is_super_admin(current_user):
        raise HTTPException(status_code=403, detail="Admin only")

    from app.models.chatbot import ChatbotFAQ
    from sqlmodel import select
    q = select(ChatbotFAQ)
    if category:
        q = q.where(ChatbotFAQ.category == category)
    q = q.order_by(ChatbotFAQ.created_at.desc())
    result = await session.exec(q)
    items = result.all() or []

    def _map(faq: ChatbotFAQ) -> dict:
        question_en = faq.question if faq.language == "en" else ""
        answer_en = faq.answer if faq.language == "en" else ""
        question_si = faq.question if faq.language == "si" else ""
        answer_si = faq.answer if faq.language == "si" else ""
        return {
            "id": faq.id,
            "category": faq.category or "general_homeopathy",
            "question_en": question_en,
            "answer_en": answer_en,
            "question_si": question_si,
            "answer_si": answer_si,
            "keywords": [],
            "is_active": bool(faq.is_active),
            "priority": 50,
            "created_at": faq.created_at.isoformat() if getattr(faq, "created_at", None) else "",
            "updated_at": faq.updated_at.isoformat() if getattr(faq, "updated_at", None) else "",
        }

    return {"status": 200, "data": [_map(f) for f in items]}


@app.post("/api/v1/api/super-admin/chatbot/faqs")
async def legacy_super_admin_chatbot_faqs_create(
    payload: dict,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if not _is_super_admin(current_user):
        raise HTTPException(status_code=403, detail="Admin only")
    from app.models.chatbot import ChatbotFAQ

    question = payload.get("question_en") or payload.get("question") or ""
    answer = payload.get("answer_en") or payload.get("answer") or ""
    category = payload.get("category")
    is_active = payload.get("is_active", True)

    faq = ChatbotFAQ(
        question=question,
        answer=answer,
        category=category,
        language="en",
        is_active=bool(is_active),
    )
    session.add(faq)
    await session.commit()
    await session.refresh(faq)
    return {"status": 200, "data": {"id": faq.id}}


@app.put("/api/v1/api/super-admin/chatbot/faqs/{faq_id}")
async def legacy_super_admin_chatbot_faqs_update(
    faq_id: str,
    payload: dict,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if not _is_super_admin(current_user):
        raise HTTPException(status_code=403, detail="Admin only")
    from app.models.chatbot import ChatbotFAQ

    faq = await session.get(ChatbotFAQ, faq_id)
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")

    if "category" in payload:
        faq.category = payload.get("category")
    if "is_active" in payload:
        faq.is_active = bool(payload.get("is_active"))
    # Prefer English fields (legacy UI)
    if payload.get("question_en") is not None:
        faq.question = payload.get("question_en") or ""
        faq.language = "en"
    elif payload.get("question") is not None:
        faq.question = payload.get("question") or ""
    if payload.get("answer_en") is not None:
        faq.answer = payload.get("answer_en") or ""
    elif payload.get("answer") is not None:
        faq.answer = payload.get("answer") or ""

    session.add(faq)
    await session.commit()
    return {"status": 200}


@app.delete("/api/v1/api/super-admin/chatbot/faqs/{faq_id}")
async def legacy_super_admin_chatbot_faqs_delete(
    faq_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if not _is_super_admin(current_user):
        raise HTTPException(status_code=403, detail="Admin only")
    from app.models.chatbot import ChatbotFAQ

    faq = await session.get(ChatbotFAQ, faq_id)
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
    await session.delete(faq)
    await session.commit()
    return {"status": 200}


@app.patch("/api/v1/api/super-admin/chatbot/faqs/{faq_id}/toggle-status")
async def legacy_super_admin_chatbot_faqs_toggle(
    faq_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if not _is_super_admin(current_user):
        raise HTTPException(status_code=403, detail="Admin only")
    from app.models.chatbot import ChatbotFAQ

    faq = await session.get(ChatbotFAQ, faq_id)
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
    faq.is_active = not bool(faq.is_active)
    session.add(faq)
    await session.commit()
    return {"status": 200, "is_active": bool(faq.is_active)}

# --- MISSING ENDPOINT STUBS ---
from fastapi import Request
from fastapi.responses import JSONResponse

@app.get("/validate-session")
async def validate_session(request: Request):
    """Validate JWT token from Authorization header or query param."""
    from app.core.config import settings
    import jwt as pyjwt

    token = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
    else:
        token = request.query_params.get("token")

    if not token:
        return JSONResponse({"valid": False, "detail": "No token provided"}, status_code=401)

    try:
        payload = pyjwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            return JSONResponse({"valid": False, "detail": "Invalid token payload"}, status_code=401)
        return JSONResponse({"valid": True, "user_id": user_id})
    except pyjwt.ExpiredSignatureError:
        return JSONResponse({"valid": False, "detail": "Token expired"}, status_code=401)
    except pyjwt.InvalidTokenError:
        return JSONResponse({"valid": False, "detail": "Invalid token"}, status_code=401)

@app.get("/api/chatbot/suggestions")
async def chatbot_suggestions(language: str = "en"):
    # Dummy suggestions
    return {"suggestions": ["How can I help you?", "Book an appointment", "Contact a doctor"]}

@app.post("/api/chatbot/chat")
async def chatbot_chat(request: Request):
    return {
        "success": True,
        "response": "I am a demo bot. Connecting to the real AI service is pending.",
        "interaction_id": "demo_123",
        "suggestions": ["View Doctors", "Check Branches"]
    }

@app.post("/api/chatbot/feedback")
async def chatbot_feedback(request: Request):
    return {"success": True}

@app.get("/api/v1/medical-insights/posts")
async def medical_insights_posts(request: Request):
    # Dummy posts data to prevent 404/401 on public page
    return {"data": []}

@app.get("/super-admin/dashboard-stats")
async def super_admin_dashboard_stats():
    # Dummy stats
    data = {"users": 10, "doctors": 5, "patients": 100}
    return {"status": 200, "data": data}

@app.get("/api/v1/notifications/admin/{admin_id}")
async def notifications_admin(admin_id: str):
    # Dummy notifications
    return {"notifications": ["Welcome!", "System update"]}

@app.get("/super-admin/pos/branches")
async def super_admin_pos_branches():
    # Dummy branches with all required fields
    branches = [
        {
            "id": "1",
            "name": "Main Branch",
            "center_name": "Alpha Center",
            "city": "Kurunegala",
            "address": "123 Main St",
            "phone": "555-1234"
        },
        {
            "id": "2",
            "name": "Sub Branch",
            "center_name": "Beta Center",
            "city": "Kurunegala",
            "address": "456 Side St",
            "phone": "555-5678"
        }
    ]
    return {"branches": branches}

@app.get("/")
def read_root():
    return {"message": "Welcome to HMS API (FastAPI + MySQL)"}

# --- Import for aliases below ---
from app.api.deps import get_current_user as _get_current_user
from app.api.deps import get_current_user

# --- Submit feedback alias (frontend calls /api/v1/submit-feedback) ---
@app.post("/api/v1/submit-feedback")
async def submit_feedback_alias(
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(_get_current_user),
):
    from app.models.patient_dashboard import Feedback
    body = await request.json()
    fb = Feedback(
        user_id=current_user.id,
        branch_id=body.get("branch_id"),
        doctor_id=body.get("doctor_id"),
        subject=body.get("subject", "General Feedback"),
        message=body.get("message", ""),
        category=body.get("category", "general"),
    )
    session.add(fb)
    await session.commit()
    await session.refresh(fb)
    return {"message": "Feedback submitted", "id": fb.id}

# --- Sign-out aliases (frontend UserSignOut.ts calls these by role) ---

@app.post("/sign-out-admin")
@app.post("/sign-out-cashier")
@app.post("/sign-out-pharmacist")
@app.post("/sign-out-patient")
async def sign_out_alias(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(_get_current_user),
):
    """Alias sign-out endpoints that the legacy frontend expects."""
    from app.models.token_blacklist import TokenBlacklist
    from datetime import datetime, timedelta, timezone
    from uuid import uuid4
    bl = TokenBlacklist(
        token_jti=str(uuid4()),
        user_id=current_user.id,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    session.add(bl)
    await session.commit()
    return {"message": "Logged out successfully"}

# --- check-credentials-exist alias (frontend calls without /api/v1/auth prefix) ---
@app.get("/check-credentials-exist")
async def check_creds_alias(
    email: str = None,
    phone: str = None,
    nic: str = None,
    session: AsyncSession = Depends(get_session),
):
    from sqlmodel import select as sel
    conflicts = []
    if email:
        r = await session.exec(sel(User).where(User.email == email))
        if r.first():
            conflicts.append({"field": "email", "value": email, "message": "Email already registered"})
    if phone:
        r = await session.exec(sel(User).where(User.contact_number_mobile == phone))
        if r.first():
            conflicts.append({"field": "phone", "value": phone, "message": "Phone number already registered"})
    if nic:
        r = await session.exec(sel(User).where(User.nic_number == nic))
        if r.first():
            conflicts.append({"field": "nic", "value": nic, "message": "NIC already registered"})
    return {"hasConflicts": len(conflicts) > 0, "conflicts": conflicts}

# --- change-password alias (frontend calls /change-password/{userId} without auth prefix) ---
@app.put("/change-password/{user_id}")
async def change_pw_alias(
    user_id: str,
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(_get_current_user),
):
    from app.core.security import verify_password as _vp, get_password_hash as _gph
    body = await request.json()
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if current_user.id != user_id and current_user.role_as != 1:
        raise HTTPException(status_code=403, detail="Not authorized")
    if not _vp(body.get("current_password", ""), user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    user.hashed_password = _gph(body["new_password"])
    session.add(user)
    await session.commit()
    return {"status": 200, "message": "Password changed successfully"}

@app.get("/health")
async def health_check():
    """Enhanced health check with database connectivity test"""
    from sqlalchemy import text
    from app.core.database import async_engine

    health_status = {
        "status": "ok",
        "api": "healthy"
    }

    try:
        # Test database connectivity
        async with async_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        health_status["database"] = "connected"
    except Exception as e:
        health_status["status"] = "degraded"
        health_status["database"] = f"error: {str(e)}"

    return health_status
