"""SMS Service — Patch 5.5 (Textware integration)"""

import httpx
from typing import Optional
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.sms_log import SmsLog
from app.core.config import settings


# SMS templates
SMS_TEMPLATES = {
    "appointment_confirm": "Dear {patient_name}, your appointment with Dr. {doctor_name} on {date} at {time} is confirmed. Ref: {ref}",
    "cancellation": "Dear {patient_name}, your appointment on {date} has been cancelled. Please contact us for rescheduling.",
    "credentials": "Welcome to {hospital_name}! Your login: Email: {email}, Password: {password}. Please change your password after first login.",
    "schedule_change": "Dear {patient_name}, your appointment has been rescheduled to {new_date} at {new_time}. Contact us if this doesn't work.",
    "payment_receipt": "Payment of Rs.{amount} received. Invoice: {invoice}. Thank you, {hospital_name}.",
    "queue_notification": "Dear {patient_name}, your queue number is {queue_no}. Approx wait: {wait_time} mins.",
}


class SmsService:

    @staticmethod
    def render_template(template_type: str, **kwargs) -> str:
        template = SMS_TEMPLATES.get(template_type)
        if not template:
            raise ValueError(f"Unknown SMS template: {template_type}")
        try:
            return template.format(**kwargs)
        except KeyError as e:
            raise ValueError(f"Missing template variable: {e}")

    @staticmethod
    async def send_sms(
        session: AsyncSession,
        recipient: str,
        message: str,
        template_type: Optional[str] = None,
    ) -> SmsLog:
        """Send SMS via Textware provider and log the result."""
        log = SmsLog(
            recipient=recipient,
            message=message,
            template_type=template_type,
            status="pending",
        )

        # Get credentials from environment
        sms_user = getattr(settings, "SMS_USER", None) or ""
        sms_password = getattr(settings, "SMS_PASSWORD", None) or ""
        sms_url = getattr(settings, "SMS_URL", None) or "http://sms.textware.lk:5001/sms/send_sms.php"

        if not sms_user or not sms_password:
            log.status = "failed"
            log.provider_response = "SMS credentials not configured"
            session.add(log)
            await session.commit()
            await session.refresh(log)
            return log

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    sms_url,
                    params={
                        "username": sms_user,
                        "password": sms_password,
                        "src": getattr(settings, "SMS_SENDER_ID", "HMS"),
                        "dst": recipient,
                        "msg": message,
                        "dr": "1",
                    },
                )
                log.provider_response = resp.text[:500]
                log.status = "sent" if resp.status_code == 200 else "failed"
        except Exception as e:
            log.status = "failed"
            log.provider_response = str(e)[:500]

        session.add(log)
        await session.commit()
        await session.refresh(log)
        return log

    @staticmethod
    async def send_templated_sms(
        session: AsyncSession,
        recipient: str,
        template_type: str,
        **kwargs,
    ) -> SmsLog:
        """Render template and send."""
        message = SmsService.render_template(template_type, **kwargs)
        return await SmsService.send_sms(session, recipient, message, template_type)
