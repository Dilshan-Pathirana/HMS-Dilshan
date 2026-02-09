"""SMS Log model — Patch 5.5"""

from sqlmodel import SQLModel, Field
import sqlalchemy as sa
from typing import Optional
from datetime import datetime, timezone
import uuid


class SmsLogBase(SQLModel):
    recipient: str = Field(max_length=20)
    message: str = Field(sa_column=sa.Column(sa.Text, nullable=False))
    template_type: Optional[str] = Field(default=None, max_length=50)  # appointment_confirm, cancellation, credentials, schedule_change, payment_receipt, queue_notification
    status: str = Field(default="pending", max_length=20)  # pending / sent / failed
    provider_response: Optional[str] = Field(default=None, max_length=500)

class SmsLog(SmsLogBase, table=True):
    __tablename__ = "sms_log"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SmsLogCreate(SmsLogBase):
    pass

class SmsLogRead(SmsLogBase):
    id: str
    created_at: datetime
