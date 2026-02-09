"""System Settings & Public Website endpoints — Patch 5.10"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import select, col
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import Optional
from datetime import datetime, timezone

from app.core.database import get_session
from app.api.deps import get_current_user
from app.models.user import User
from app.models.website import (
    SystemSettings, SystemSettingsRead,
    WebDoctor, WebDoctorRead,
    WebService, WebServiceRead,
    ContactMessage, ContactMessageRead,
)

router = APIRouter()


# =============== SYSTEM SETTINGS (Super Admin) ===============

@router.get("/settings", response_model=list[SystemSettingsRead])
async def list_settings(
    category: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role_as != 1:
        raise HTTPException(status_code=403, detail="Super admin only")
    q = select(SystemSettings)
    if category:
        q = q.where(SystemSettings.category == category)
    q = q.order_by(col(SystemSettings.key))
    result = await session.exec(q)
    return list(result.all())


@router.get("/settings/{key}")
async def get_setting(
    key: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role_as != 1:
        raise HTTPException(status_code=403, detail="Super admin only")
    q = select(SystemSettings).where(SystemSettings.key == key)
    result = await session.exec(q)
    setting = result.first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    return setting


@router.put("/settings/{key}")
async def upsert_setting(
    key: str,
    payload: dict,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role_as != 1:
        raise HTTPException(status_code=403, detail="Super admin only")
    q = select(SystemSettings).where(SystemSettings.key == key)
    result = await session.exec(q)
    setting = result.first()
    if setting:
        setting.value = payload.get("value", setting.value)
        setting.description = payload.get("description", setting.description)
        setting.category = payload.get("category", setting.category)
        setting.updated_at = datetime.now(timezone.utc)
    else:
        setting = SystemSettings(
            key=key,
            value=payload.get("value"),
            category=payload.get("category"),
            description=payload.get("description"),
        )
    session.add(setting)
    await session.commit()
    await session.refresh(setting)
    return setting


@router.delete("/settings/{key}")
async def delete_setting(
    key: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role_as != 1:
        raise HTTPException(status_code=403, detail="Super admin only")
    q = select(SystemSettings).where(SystemSettings.key == key)
    result = await session.exec(q)
    setting = result.first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    await session.delete(setting)
    await session.commit()
    return {"message": "Setting deleted"}


# =============== PUBLIC WEBSITE ===============

# ---- Doctors (public) ----

@router.get("/website/doctors", response_model=list[WebDoctorRead])
async def list_web_doctors(
    session: AsyncSession = Depends(get_session),
):
    """Public: list doctors for website display."""
    q = select(WebDoctor).order_by(col(WebDoctor.display_order))
    result = await session.exec(q)
    return list(result.all())


@router.post("/website/doctors", response_model=WebDoctorRead, status_code=201)
async def create_web_doctor(
    payload: dict,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role_as != 1:
        raise HTTPException(status_code=403, detail="Admin only")
    doc = WebDoctor(
        doctor_id=payload.get("doctor_id"),
        display_name=payload.get("display_name", ""),
        photo=payload.get("photo"),
        bio=payload.get("bio"),
        specialization=payload.get("specialization"),
        display_order=payload.get("display_order", 0),
    )
    session.add(doc)
    await session.commit()
    await session.refresh(doc)
    return doc


@router.put("/website/doctors/{doc_id}", response_model=WebDoctorRead)
async def update_web_doctor(
    doc_id: str,
    payload: dict,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role_as != 1:
        raise HTTPException(status_code=403, detail="Admin only")
    doc = await session.get(WebDoctor, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    for key in ("display_name", "photo", "bio", "specialization", "display_order", "doctor_id"):
        if key in payload:
            setattr(doc, key, payload[key])
    session.add(doc)
    await session.commit()
    await session.refresh(doc)
    return doc


@router.delete("/website/doctors/{doc_id}")
async def delete_web_doctor(
    doc_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role_as != 1:
        raise HTTPException(status_code=403, detail="Admin only")
    doc = await session.get(WebDoctor, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    await session.delete(doc)
    await session.commit()
    return {"message": "Deleted"}


# ---- Services (public) ----

@router.get("/website/services", response_model=list[WebServiceRead])
async def list_web_services(
    session: AsyncSession = Depends(get_session),
):
    """Public: list services for website display."""
    q = select(WebService).where(WebService.is_active == True).order_by(col(WebService.display_order))
    result = await session.exec(q)
    return list(result.all())


@router.post("/website/services", response_model=WebServiceRead, status_code=201)
async def create_web_service(
    payload: dict,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role_as != 1:
        raise HTTPException(status_code=403, detail="Admin only")
    svc = WebService(
        title=payload.get("title", ""),
        description=payload.get("description"),
        icon=payload.get("icon"),
        display_order=payload.get("display_order", 0),
        is_active=payload.get("is_active", True),
    )
    session.add(svc)
    await session.commit()
    await session.refresh(svc)
    return svc


@router.put("/website/services/{svc_id}", response_model=WebServiceRead)
async def update_web_service(
    svc_id: str,
    payload: dict,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role_as != 1:
        raise HTTPException(status_code=403, detail="Admin only")
    svc = await session.get(WebService, svc_id)
    if not svc:
        raise HTTPException(status_code=404, detail="Not found")
    for key in ("title", "description", "icon", "display_order", "is_active"):
        if key in payload:
            setattr(svc, key, payload[key])
    session.add(svc)
    await session.commit()
    await session.refresh(svc)
    return svc


@router.delete("/website/services/{svc_id}")
async def delete_web_service(
    svc_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role_as != 1:
        raise HTTPException(status_code=403, detail="Admin only")
    svc = await session.get(WebService, svc_id)
    if not svc:
        raise HTTPException(status_code=404, detail="Not found")
    await session.delete(svc)
    await session.commit()
    return {"message": "Deleted"}


# ---- Contact Form (public submit, admin manage) ----

@router.post("/website/contact", response_model=ContactMessageRead, status_code=201)
async def submit_contact(
    payload: dict,
    session: AsyncSession = Depends(get_session),
):
    """Public: submit a contact message."""
    msg = ContactMessage(
        name=payload.get("name", ""),
        email=payload.get("email"),
        phone=payload.get("phone"),
        subject=payload.get("subject"),
        message=payload.get("message", ""),
    )
    session.add(msg)
    await session.commit()
    await session.refresh(msg)
    return msg


@router.get("/website/contacts", response_model=list[ContactMessageRead])
async def list_contacts(
    status: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role_as != 1:
        raise HTTPException(status_code=403, detail="Admin only")
    q = select(ContactMessage)
    if status:
        q = q.where(ContactMessage.status == status)
    q = q.order_by(col(ContactMessage.created_at).desc()).offset(skip).limit(limit)
    result = await session.exec(q)
    return list(result.all())


@router.put("/website/contacts/{msg_id}")
async def update_contact_status(
    msg_id: str,
    payload: dict,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role_as != 1:
        raise HTTPException(status_code=403, detail="Admin only")
    msg = await session.get(ContactMessage, msg_id)
    if not msg:
        raise HTTPException(status_code=404, detail="Not found")
    if "status" in payload:
        msg.status = payload["status"]
        if msg.status == "responded":
            msg.responded_at = datetime.now(timezone.utc)
    session.add(msg)
    await session.commit()
    await session.refresh(msg)
    return msg
