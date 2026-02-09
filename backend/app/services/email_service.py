"""Email Service — Patch 5.7 (Background email via SMTP)"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from app.core.config import settings


# Email templates
EMAIL_TEMPLATES = {
    "purchase_request_supplier": {
        "subject": "New Purchase Request from {hospital_name}",
        "body": """
Dear {supplier_name},

A new purchase request has been submitted from {hospital_name}.

Request ID: {request_id}
Total Amount: Rs. {total_amount}
Notes: {notes}

Please log in to the supplier portal or contact us for details.

Regards,
{hospital_name} Procurement Team
"""
    },
    "purchase_request_approval": {
        "subject": "Purchase Request {status} — {request_id}",
        "body": """
Dear {requester_name},

Your purchase request ({request_id}) has been {status}.

Total Amount: Rs. {total_amount}
{notes_section}

Regards,
{hospital_name} Admin
"""
    },
    "appointment_confirmation": {
        "subject": "Appointment Confirmed — {hospital_name}",
        "body": """
Dear {patient_name},

Your appointment has been confirmed.

Doctor: Dr. {doctor_name}
Date: {date}
Time: {time}
Reference: {ref}

Please arrive 15 minutes early.

Regards,
{hospital_name}
"""
    },
}


class EmailService:

    @staticmethod
    def _get_smtp_config() -> dict:
        return {
            "host": getattr(settings, "SMTP_HOST", "smtp.gmail.com"),
            "port": int(getattr(settings, "SMTP_PORT", 587)),
            "user": getattr(settings, "SMTP_USER", ""),
            "password": getattr(settings, "SMTP_PASSWORD", ""),
            "from_email": getattr(settings, "SMTP_FROM_EMAIL", ""),
            "from_name": getattr(settings, "SMTP_FROM_NAME", "HMS System"),
        }

    @staticmethod
    def render_template(template_name: str, **kwargs) -> tuple[str, str]:
        """Render email template returning (subject, body)."""
        tmpl = EMAIL_TEMPLATES.get(template_name)
        if not tmpl:
            raise ValueError(f"Unknown email template: {template_name}")
        subject = tmpl["subject"].format(**kwargs)
        body = tmpl["body"].format(**kwargs)
        return subject, body

    @staticmethod
    def send_email_sync(
        to_email: str,
        subject: str,
        body: str,
        html: bool = False,
    ) -> dict:
        """Send email via SMTP (synchronous — use in BackgroundTasks)."""
        cfg = EmailService._get_smtp_config()
        if not cfg["user"] or not cfg["password"]:
            return {"success": False, "error": "SMTP credentials not configured"}

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{cfg['from_name']} <{cfg['from_email'] or cfg['user']}>"
        msg["To"] = to_email

        content_type = "html" if html else "plain"
        msg.attach(MIMEText(body, content_type))

        try:
            with smtplib.SMTP(cfg["host"], cfg["port"]) as server:
                server.starttls()
                server.login(cfg["user"], cfg["password"])
                server.send_message(msg)
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def send_template_email_sync(
        to_email: str,
        template_name: str,
        **kwargs,
    ) -> dict:
        """Render template and send (synchronous)."""
        subject, body = EmailService.render_template(template_name, **kwargs)
        return EmailService.send_email_sync(to_email, subject, body)
