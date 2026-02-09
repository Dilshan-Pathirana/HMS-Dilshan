"""
Soft-delete mixin for SQLModel models.

Usage:
    class MyModel(SoftDeleteMixin, SQLModel, table=True):
        id: str = Field(...)
        name: str
"""
from typing import Optional
from datetime import datetime, timezone
from sqlmodel import Field


class SoftDeleteMixin:
    """Mixin that adds soft-delete columns to a model."""
    is_deleted: bool = Field(default=False, index=True)
    deleted_at: Optional[datetime] = Field(default=None)

    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = datetime.now(timezone.utc)

    def restore(self):
        self.is_deleted = False
        self.deleted_at = None
