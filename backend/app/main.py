from fastapi import FastAPI, Request, Depends, HTTPException
from app.api import auth, users, branches, doctors, patients, receptionist, pharmacies, pharmacist, super_admin, nurse, staff, appointments, schedules
from app.api import super_admin_appointments
from app.api import doctor_main_questions
from app.api import patient_appointments, doctor_appointments, admin_appointments, patient_dashboard, consultation, pharmacy_inventory, notifications, pos, hrm_leave, hrm_salary, hrm_shift, hrm_admin, branch_admin, purchase_requests, medical_insights, doctor_sessions, chatbot, sms, payments, email, websocket_alerts, dashboard_stats, website
import traceback
import sys
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.database import get_session
from app.models.user import User
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
    return JSONResponse(
        status_code=422,
        content={"detail": "Validation Error", "errors": exc.errors()},
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

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(branches.router, prefix="/api/v1/branches", tags=["branches"])
app.include_router(doctors.router, prefix="/api/v1/doctors", tags=["doctors"])
app.include_router(patients.router, prefix="/api/v1/patients", tags=["patients"])
app.include_router(appointments.router, prefix="/api/v1/appointments", tags=["appointments"])
app.include_router(receptionist.router, prefix="/api/v1/receptionist", tags=["receptionist"])
app.include_router(pharmacies.router, prefix="/api/v1/pharmacies", tags=["pharmacies"])
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
app.include_router(hrm_leave.router, prefix="/api/v1/hrm", tags=["hrm-leave"])
app.include_router(hrm_salary.router, prefix="/api/v1/hrm", tags=["hrm-salary"])
app.include_router(hrm_shift.router, prefix="/api/v1/hrm", tags=["hrm-shift"])
app.include_router(hrm_admin.router, prefix="/api/v1/hrm", tags=["hrm-admin"])
app.include_router(branch_admin.router, prefix="/api/v1/branch-admin", tags=["branch-admin-mgmt"])
app.include_router(purchase_requests.router, prefix="/api/v1", tags=["purchase-requests"])
app.include_router(medical_insights.router, prefix="/api/v1/medical-insights", tags=["medical-insights"])
app.include_router(doctor_sessions.router, prefix="/api/v1/doctor", tags=["doctor-sessions"])
app.include_router(chatbot.router, prefix="/api/v1/chatbot", tags=["chatbot"])
app.include_router(sms.router, prefix="/api/v1/sms", tags=["sms"])
app.include_router(payments.router, prefix="/api/v1/payments", tags=["payments"])
app.include_router(email.router, prefix="/api/v1/email", tags=["email"])
app.include_router(websocket_alerts.router, tags=["websocket"])
app.include_router(dashboard_stats.router, prefix="/api/v1", tags=["dashboard-stats"])
app.include_router(website.router, prefix="/api/v1", tags=["website-settings"])

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
