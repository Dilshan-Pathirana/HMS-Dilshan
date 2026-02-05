from fastapi import FastAPI, Request
import traceback
import sys
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="HMS API",
    description="Hospital Management System API with FastAPI and MySQL",
    version="1.0.0"
)

# Global exception handler for logging
@app.exception_handler(Exception)
async def log_exception_handler(request: Request, exc: Exception):
    print("\n--- Unhandled Exception ---", file=sys.stderr)
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
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

from app.api import auth, branches, doctors, patients, users, receptionist

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(branches.router, prefix="/api/v1/branches", tags=["branches"])
app.include_router(doctors.router, prefix="/api/v1/doctors", tags=["doctors"])
app.include_router(patients.router, prefix="/api/v1/patients", tags=["patients"])
app.include_router(receptionist.router, prefix="/api/v1/receptionist", tags=["receptionist"])

# --- MISSING ENDPOINT STUBS ---
from fastapi import Request
from fastapi.responses import JSONResponse

@app.get("/validate-session")
async def validate_session(request: Request):
    # Dummy session validation
    # In production, check token validity here
    return JSONResponse({"valid": True})

@app.get("/api/chatbot/suggestions")
async def chatbot_suggestions(language: str = "en"):
    # Dummy suggestions
    return {"suggestions": ["How can I help you?", "Book an appointment", "Contact a doctor"]}

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
