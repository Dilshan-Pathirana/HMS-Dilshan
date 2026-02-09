"""Email endpoints — Patch 5.7"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from app.api.deps import get_current_user
from app.models.user import User
from app.services.email_service import EmailService

router = APIRouter()


@router.post("/send")
async def send_email(
    payload: dict,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
):
    """Send an email. Runs in background task to avoid blocking."""
    if current_user.role_as not in (1, 2):
        raise HTTPException(status_code=403, detail="Admin only")

    to_email = payload.get("to_email", "")
    template_name = payload.get("template_name")
    subject = payload.get("subject", "")
    body = payload.get("body", "")

    if not to_email:
        raise HTTPException(status_code=400, detail="to_email is required")

    if template_name:
        variables = payload.get("variables", {})
        background_tasks.add_task(
            EmailService.send_template_email_sync,
            to_email,
            template_name,
            **variables,
        )
    else:
        if not subject or not body:
            raise HTTPException(status_code=400, detail="subject and body required for non-template emails")
        background_tasks.add_task(
            EmailService.send_email_sync,
            to_email,
            subject,
            body,
        )

    return {"success": True, "message": "Email queued for delivery"}


@router.get("/templates")
async def list_templates(
    current_user: User = Depends(get_current_user),
):
    """List available email templates."""
    from app.services.email_service import EMAIL_TEMPLATES
    return {
        "templates": [
            {"name": k, "subject_pattern": v["subject"]}
            for k, v in EMAIL_TEMPLATES.items()
        ]
    }
