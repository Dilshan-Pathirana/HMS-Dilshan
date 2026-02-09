"""
Auth Router — Patch 1.1
Endpoints: login, register, logout, forgot-password, reset-password,
           refresh-token, change-password, check-credentials
"""
from datetime import datetime, timedelta, timezone
from typing import Annotated, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
import jwt as pyjwt

from app.core.database import get_session
from app.core.security import create_access_token, verify_password, get_password_hash
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
    """Generate a password-reset token. In production this would be emailed/SMS'd."""
    query = select(User)
    if body.email:
        query = query.where(User.email == body.email)
    elif body.phone:
        query = query.where(User.contact_number_mobile == body.phone)
    else:
        raise HTTPException(status_code=400, detail="Provide email or phone")

    result = await session.exec(query)
    user = result.first()

    # Don't reveal whether user exists — always return success
    if not user:
        return {"message": "If the account exists, a reset link has been sent."}

    # Create a short-lived reset token (15 min)
    reset_payload = {
        "sub": user.id,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
        "type": "password_reset",
        "jti": _make_jti(),
    }
    reset_token = pyjwt.encode(reset_payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    # TODO: Send email/SMS with reset_token link
    # For now, return it in response (dev only)
    return {
        "message": "If the account exists, a reset link has been sent.",
        "reset_token": reset_token,  # Remove in production
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
