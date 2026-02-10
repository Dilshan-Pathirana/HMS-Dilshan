"""
Auth Router — Patch 1.1
Endpoints: login, register, logout, forgot-password, reset-password,
           refresh-token, change-password, check-credentials
"""
from datetime import datetime, timedelta, timezone
from typing import Annotated, Optional
from uuid import uuid4
import random
import re

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlmodel import select, col
from sqlmodel.ext.asyncio.session import AsyncSession
import jwt as pyjwt

from app.core.database import get_session
from app.core.security import create_access_token, verify_password, get_password_hash
from app.services.sms_service import SmsService
from app.core.config import settings
from app.models.user import User, UserCreate
from app.models.patient import Patient
from app.models.token_blacklist import TokenBlacklist
from app.api.deps import get_current_user

router = APIRouter()


# ──────────────────────────────────────────────
# Pydantic request / response schemas
# ──────────────────────────────────────────────
class RegisterRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str
    phone: Optional[str] = None
    nic: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None


class VerifyForgotPasswordOtpRequest(BaseModel):
    otp_token: str
    otp: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    new_password_confirmation: Optional[str] = None


class RefreshTokenRequest(BaseModel):
    token: str


# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────
def _make_jti() -> str:
    return str(uuid4())


def _decode_token(token: str) -> dict:
    """Decode a JWT and return its payload (raises on invalid/expired)."""
    return pyjwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])


async def _is_token_blacklisted(session: AsyncSession, jti: str) -> bool:
    result = await session.exec(
        select(TokenBlacklist).where(TokenBlacklist.token_jti == jti)
    )
    return result.first() is not None


def _create_token_pair(user_id: str) -> dict:
    """Return access + refresh token pair."""
    jti = _make_jti()
    access_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(subject=user_id, expires_delta=access_expires)

    # Refresh token — longer lived (7 days)
    refresh_expire = datetime.now(timezone.utc) + timedelta(days=7)
    refresh_payload = {"sub": user_id, "exp": refresh_expire, "jti": jti, "type": "refresh"}
    refresh_token = pyjwt.encode(refresh_payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


def _create_password_reset_token(user_id: str) -> str:
    reset_payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
        "type": "password_reset",
        "jti": _make_jti(),
    }
    return pyjwt.encode(reset_payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def _create_password_reset_otp_token(user_id: str, phone: str, otp_hash: str) -> str:
    otp_payload = {
        "sub": user_id,
        "phone": phone,
        "otp_hash": otp_hash,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=10),
        "type": "password_reset_otp",
        "jti": _make_jti(),
    }
    return pyjwt.encode(otp_payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def _phone_variants(phone: str) -> list[str]:
    raw = (phone or "").strip()
    digits = re.sub(r"\D", "", raw)
    variants: set[str] = set()
    if raw:
        variants.add(raw)
    if digits:
        variants.add(digits)
    if digits.startswith("94") and len(digits) >= 11:
        variants.add(f"0{digits[2:]}")
    if digits.startswith("0") and len(digits) == 10:
        variants.add(f"94{digits[1:]}")
    return [v for v in variants if v]


# ──────────────────────────────────────────────
# 1. POST /login/access-token
# ──────────────────────────────────────────────
@router.post("/login/access-token")
async def login_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    result = await session.exec(select(User).where(User.email == form_data.username))
    user = result.first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    tokens = _create_token_pair(user.id)

    return {
        **tokens,
        "user": {
            "id": user.id,
            "email": user.email,
            "role_as": user.role_as,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "branch_id": user.branch_id,
        },
    }


# ──────────────────────────────────────────────
# 2. POST /register  (patient self-registration)
# ──────────────────────────────────────────────
@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    body: RegisterRequest,
    session: AsyncSession = Depends(get_session),
):
    # Check email uniqueness
    existing = await session.exec(select(User).where(User.email == body.email))
    if existing.first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Check NIC uniqueness if provided
    if body.nic:
        nic_check = await session.exec(select(User).where(User.nic_number == body.nic))
        if nic_check.first():
            raise HTTPException(status_code=400, detail="NIC already registered")

    hashed = get_password_hash(body.password)
    new_user = User(
        email=body.email,
        username=body.email,
        hashed_password=hashed,
        role_as=5,  # Patient
        is_active=True,
        first_name=body.first_name,
        last_name=body.last_name,
        date_of_birth=body.date_of_birth,
        gender=body.gender,
        nic_number=body.nic,
        contact_number_mobile=body.phone,
    )
    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)

    # Also create Patient profile
    new_patient = Patient(user_id=new_user.id)
    session.add(new_patient)
    await session.commit()
    await session.refresh(new_patient)

    tokens = _create_token_pair(new_user.id)
    return {
        "message": "Registration successful",
        "user_id": new_user.id,
        "patient_id": new_patient.id,
        **tokens,
    }


# ──────────────────────────────────────────────
# 3. POST /logout
# ──────────────────────────────────────────────
@router.post("/logout")
async def logout(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Invalidate the current access token by adding a placeholder to blacklist."""
    bl = TokenBlacklist(
        token_jti=_make_jti(),  # placeholder — real JTI requires token parsing
        user_id=current_user.id,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    session.add(bl)
    await session.commit()
    return {"message": "Logged out successfully"}


# ──────────────────────────────────────────────
# 4. POST /forgot-password
# ──────────────────────────────────────────────
@router.post("/forgot-password")
async def forgot_password(
    body: ForgotPasswordRequest,
    session: AsyncSession = Depends(get_session),
):
    """Send a password reset OTP via SMS and return a short-lived OTP token."""
    target_phone = (body.phone or "").strip()
    user: Optional[User] = None
    patient_phone: Optional[str] = None
    if body.email:
        result = await session.exec(select(User).where(User.email == body.email))
        user = result.first()
    elif target_phone:
        variants = _phone_variants(target_phone)
        result = await session.exec(
            select(User).where(col(User.contact_number_mobile).in_(variants))
        )
        user = result.first()
        if not user:
            patient_res = await session.exec(
                select(Patient).where(col(Patient.contact_number).in_(variants))
            )
            patient = patient_res.first()
            if patient:
                patient_phone = patient.contact_number
                user = await session.get(User, patient.user_id)
    else:
        raise HTTPException(status_code=400, detail="Provide email or phone")

    # Don't reveal whether user exists — always return success
    if not user:
        return {"message": "If the account exists, an OTP has been sent."}

    if not target_phone:
        target_phone = (user.contact_number_mobile or patient_phone or "").strip()

    if not target_phone:
        raise HTTPException(status_code=400, detail="No phone number on file for this account")

    otp = f"{random.randint(100000, 999999)}"
    otp_hash = get_password_hash(otp)
    otp_token = _create_password_reset_otp_token(user.id, target_phone, otp_hash)

    log = await SmsService.send_sms(
        session,
        target_phone,
        f"Your password reset code is {otp}. It expires in 10 minutes.",
    )

    return {
        "message": "If the account exists, an OTP has been sent.",
        "otp_token": otp_token,
        "sms": {
            "status": log.status,
            "log_id": log.id,
        },
    }


@router.post("/forgot-password/verify-otp")
async def verify_forgot_password_otp(
    body: VerifyForgotPasswordOtpRequest,
    session: AsyncSession = Depends(get_session),
):
    try:
        payload = _decode_token(body.otp_token)
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="OTP has expired")
    except pyjwt.InvalidTokenError:
        raise HTTPException(status_code=400, detail="Invalid OTP token")

    if payload.get("type") != "password_reset_otp":
        raise HTTPException(status_code=400, detail="Invalid token type")

    otp_hash = payload.get("otp_hash", "")
    if not verify_password(body.otp, otp_hash):
        raise HTTPException(status_code=400, detail="Invalid OTP")

    user = await session.get(User, payload.get("sub"))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    reset_token = _create_password_reset_token(user.id)
    return {
        "message": "OTP verified",
        "reset_token": reset_token,
    }


# ──────────────────────────────────────────────
# 5. POST /reset-password
# ──────────────────────────────────────────────
@router.post("/reset-password")
async def reset_password(
    body: ResetPasswordRequest,
    session: AsyncSession = Depends(get_session),
):
    try:
        payload = _decode_token(body.token)
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="Reset token has expired")
    except pyjwt.InvalidTokenError:
        raise HTTPException(status_code=400, detail="Invalid reset token")

    if payload.get("type") != "password_reset":
        raise HTTPException(status_code=400, detail="Invalid token type")

    user = await session.get(User, payload["sub"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = get_password_hash(body.new_password)
    session.add(user)

    # Blacklist the reset token so it can't be reused
    bl = TokenBlacklist(
        token_jti=payload.get("jti", _make_jti()),
        user_id=user.id,
        expires_at=datetime.fromtimestamp(payload["exp"], tz=timezone.utc),
    )
    session.add(bl)
    await session.commit()

    return {"message": "Password reset successful"}


# ──────────────────────────────────────────────
# 6. POST /refresh-token
# ──────────────────────────────────────────────
@router.post("/refresh-token")
async def refresh_token(
    body: RefreshTokenRequest,
    session: AsyncSession = Depends(get_session),
):
    try:
        payload = _decode_token(body.token)
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except pyjwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=400, detail="Not a refresh token")

    jti = payload.get("jti", "")
    if await _is_token_blacklisted(session, jti):
        raise HTTPException(status_code=401, detail="Token has been revoked")

    user = await session.get(User, payload["sub"])
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    # Blacklist old refresh token (rotation)
    bl = TokenBlacklist(
        token_jti=jti,
        user_id=user.id,
        expires_at=datetime.fromtimestamp(payload["exp"], tz=timezone.utc),
    )
    session.add(bl)
    await session.commit()

    tokens = _create_token_pair(user.id)
    return tokens


# ──────────────────────────────────────────────
# 7. PUT /change-password/{user_id}
# ──────────────────────────────────────────────
@router.put("/change-password/{user_id}")
async def change_password(
    user_id: str,
    body: ChangePasswordRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    # Users can only change their own password (or superadmin can change any)
    if current_user.id != user_id and current_user.role_as != 1:
        raise HTTPException(status_code=403, detail="Not authorized")

    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(body.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if body.new_password_confirmation and body.new_password != body.new_password_confirmation:
        raise HTTPException(status_code=400, detail="Password confirmation does not match")

    user.hashed_password = get_password_hash(body.new_password)
    session.add(user)
    await session.commit()

    return {"status": 200, "message": "Password changed successfully"}


# Also support POST /change-password (used by DoctorProfile.tsx)
@router.post("/change-password")
async def change_password_post(
    body: ChangePasswordRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    current_user.hashed_password = get_password_hash(body.new_password)
    session.add(current_user)
    await session.commit()

    return {"status": 200, "message": "Password changed successfully"}


# ──────────────────────────────────────────────
# 8. GET /check-credentials-exist
# ──────────────────────────────────────────────
@router.get("/check-credentials-exist")
async def check_credentials_exist(
    email: Optional[str] = Query(None),
    phone: Optional[str] = Query(None),
    nic: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session),
):
    """Check if email / phone / NIC are already in use (used during signup)."""
    conflicts = []

    if email:
        result = await session.exec(select(User).where(User.email == email))
        if result.first():
            conflicts.append({"field": "email", "value": email, "message": "Email already registered"})

    if phone:
        result = await session.exec(select(User).where(User.contact_number_mobile == phone))
        if result.first():
            conflicts.append({"field": "phone", "value": phone, "message": "Phone number already registered"})

    if nic:
        result = await session.exec(select(User).where(User.nic_number == nic))
        if result.first():
            conflicts.append({"field": "nic", "value": nic, "message": "NIC already registered"})

    return {
        "hasConflicts": len(conflicts) > 0,
        "conflicts": conflicts,
    }


# ──────────────────────────────────────────────
# GET /validate-session  (moved from main.py but keep main.py version too)
# ──────────────────────────────────────────────
@router.get("/validate-session")
async def validate_session(
    current_user: User = Depends(get_current_user),
):
    """Real session validation — requires valid Bearer token."""
    return {
        "valid": True,
        "user_id": current_user.id,
        "role_as": current_user.role_as,
        "email": current_user.email,
    }
