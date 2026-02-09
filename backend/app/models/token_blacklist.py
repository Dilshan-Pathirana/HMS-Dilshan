from typing import Optional
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field
from uuid import uuid4


class TokenBlacklist(SQLModel, table=True):
    __tablename__ = "token_blacklist"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    token_jti: str = Field(index=True, max_length=64)
    user_id: str = Field(foreign_key="user.id", max_length=36)
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class TokenBlacklistCreate(SQLModel):
    token_jti: str
    user_id: str
    expires_at: datetime
