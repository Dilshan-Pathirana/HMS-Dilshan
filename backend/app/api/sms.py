"""SMS endpoints — Patch 5.5"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import select, col
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import Optional

from app.core.database import get_session
from app.api.deps import get_current_user
from app.models.user import User
from app.models.sms_log import SmsLog, SmsLogRead
from app.services.sms_service import SmsService

router = APIRouter()


@router.post("/send")
async def send_sms(
    payload: dict,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Send an SMS. Accepts either raw message or template_type + variables."""
    recipient = payload.get("recipient", payload.get("phone", ""))
    if not recipient:
        raise HTTPException(status_code=400, detail="recipient is required")

    template_type = payload.get("template_type")
    if template_type:
        variables = payload.get("variables", {})
        try:
            log = await SmsService.send_templated_sms(session, recipient, template_type, **variables)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    else:
        message = payload.get("message", "")
        if not message:
            raise HTTPException(status_code=400, detail="message or template_type required")
        log = await SmsService.send_sms(session, recipient, message)

    return {
        "success": log.status == "sent",
        "log_id": log.id,
        "status": log.status,
        "provider_response": log.provider_response,
    }


@router.get("/logs", response_model=list[SmsLogRead])
async def list_sms_logs(
    template_type: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Admin: view SMS send logs."""
    if current_user.role_as != 1:
        raise HTTPException(status_code=403, detail="Admin only")
    q = select(SmsLog)
    if template_type:
        q = q.where(SmsLog.template_type == template_type)
    if status:
        q = q.where(SmsLog.status == status)
    q = q.order_by(col(SmsLog.created_at).desc()).offset(skip).limit(limit)
    result = await session.exec(q)
    return list(result.all())
