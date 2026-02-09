"""
Auth Service — business logic for authentication.
Routes should call these methods instead of containing logic directly.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import uuid4

import jwt as pyjwt
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.core.security import create_access_token, verify_password, get_password_hash
from app.models.user import User
from app.models.patient import Patient
from app.models.token_blacklist import TokenBlacklist


class AuthService:
    def __init__(self, session: AsyncSession):
        self.session = session

    # ── helpers ──────────────────────────────
    @staticmethod
    def _make_jti() -> str:
        return str(uuid4())

    def _create_token_pair(self, user_id: str) -> dict:
        jti = self._make_jti()
        access_token = create_access_token(
            subject=user_id,
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        )
        refresh_expire = datetime.now(timezone.utc) + timedelta(days=7)
        refresh_payload = {"sub": user_id, "exp": refresh_expire, "jti": jti, "type": "refresh"}
        refresh_token = pyjwt.encode(refresh_payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

    async def _is_blacklisted(self, jti: str) -> bool:
        result = await self.session.exec(
            select(TokenBlacklist).where(TokenBlacklist.token_jti == jti)
        )
        return result.first() is not None

    async def _blacklist_token(self, jti: str, user_id: str, expires_at: datetime):
        bl = TokenBlacklist(token_jti=jti, user_id=user_id, expires_at=expires_at)
        self.session.add(bl)
        await self.session.commit()

    # ── public methods ──────────────────────
    async def login(self, email: str, password: str) -> dict:
        result = await self.session.exec(select(User).where(User.email == email))
        user = result.first()
        if not user or not verify_password(password, user.hashed_password):
            raise ValueError("Incorrect email or password")
        if not user.is_active:
            raise ValueError("Inactive user")
        tokens = self._create_token_pair(user.id)
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

    async def register_patient(
        self,
        *,
        first_name: str,
        last_name: str,
        email: str,
        password: str,
        phone: Optional[str] = None,
        nic: Optional[str] = None,
        date_of_birth: Optional[str] = None,
        gender: Optional[str] = None,
    ) -> dict:
        existing = await self.session.exec(select(User).where(User.email == email))
        if existing.first():
            raise ValueError("Email already registered")
        if nic:
            nic_check = await self.session.exec(select(User).where(User.nic_number == nic))
            if nic_check.first():
                raise ValueError("NIC already registered")

        new_user = User(
            email=email, username=email, hashed_password=get_password_hash(password),
            role_as=5, is_active=True, first_name=first_name, last_name=last_name,
            date_of_birth=date_of_birth, gender=gender, nic_number=nic,
            contact_number_mobile=phone,
        )
        self.session.add(new_user)
        await self.session.commit()
        await self.session.refresh(new_user)

        patient = Patient(user_id=new_user.id)
        self.session.add(patient)
        await self.session.commit()
        await self.session.refresh(patient)

        tokens = self._create_token_pair(new_user.id)
        return {"user_id": new_user.id, "patient_id": patient.id, **tokens}

    async def logout(self, user_id: str):
        await self._blacklist_token(
            jti=self._make_jti(), user_id=user_id,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        )

    async def forgot_password(self, email: Optional[str] = None, phone: Optional[str] = None) -> Optional[str]:
        query = select(User)
        if email:
            query = query.where(User.email == email)
        elif phone:
            query = query.where(User.contact_number_mobile == phone)
        else:
            raise ValueError("Provide email or phone")
        result = await self.session.exec(query)
        user = result.first()
        if not user:
            return None  # don't reveal existence
        reset_payload = {
            "sub": user.id, "type": "password_reset", "jti": self._make_jti(),
            "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
        }
        return pyjwt.encode(reset_payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    async def reset_password(self, token: str, new_password: str):
        payload = pyjwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "password_reset":
            raise ValueError("Invalid token type")
        user = await self.session.get(User, payload["sub"])
        if not user:
            raise ValueError("User not found")
        user.hashed_password = get_password_hash(new_password)
        self.session.add(user)
        await self._blacklist_token(
            jti=payload.get("jti", self._make_jti()), user_id=user.id,
            expires_at=datetime.fromtimestamp(payload["exp"], tz=timezone.utc),
        )

    async def refresh_token(self, token: str) -> dict:
        payload = pyjwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "refresh":
            raise ValueError("Not a refresh token")
        jti = payload.get("jti", "")
        if await self._is_blacklisted(jti):
            raise ValueError("Token revoked")
        user = await self.session.get(User, payload["sub"])
        if not user or not user.is_active:
            raise ValueError("User not found or inactive")
        await self._blacklist_token(
            jti=jti, user_id=user.id,
            expires_at=datetime.fromtimestamp(payload["exp"], tz=timezone.utc),
        )
        return self._create_token_pair(user.id)

    async def change_password(self, user: User, current_password: str, new_password: str):
        if not verify_password(current_password, user.hashed_password):
            raise ValueError("Current password is incorrect")
        user.hashed_password = get_password_hash(new_password)
        self.session.add(user)
        await self.session.commit()

    async def check_credentials(
        self, email: Optional[str] = None, phone: Optional[str] = None, nic: Optional[str] = None,
    ) -> dict:
        conflicts = []
        if email:
            r = await self.session.exec(select(User).where(User.email == email))
            if r.first():
                conflicts.append({"field": "email", "value": email, "message": "Email already registered"})
        if phone:
            r = await self.session.exec(select(User).where(User.contact_number_mobile == phone))
            if r.first():
                conflicts.append({"field": "phone", "value": phone, "message": "Phone number already registered"})
        if nic:
            r = await self.session.exec(select(User).where(User.nic_number == nic))
            if r.first():
                conflicts.append({"field": "nic", "value": nic, "message": "NIC already registered"})
        return {"hasConflicts": len(conflicts) > 0, "conflicts": conflicts}
