"""Purchase Request models — Patch 5.1"""

from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime, timezone
import uuid


# ---------- PurchaseRequest ----------

class PurchaseRequestBase(SQLModel):
    branch_id: str = Field(max_length=36, index=True)
    requested_by: str = Field(max_length=36, index=True)
    supplier_id: Optional[str] = Field(default=None, max_length=36)
    status: str = Field(default="draft", max_length=30)  # draft/submitted/approved/rejected/clarification_needed/fulfilled
    total_amount: float = Field(default=0.0)
    notes: Optional[str] = Field(default=None)
    approved_by: Optional[str] = Field(default=None, max_length=36)
    approved_at: Optional[datetime] = Field(default=None)
    submitted_at: Optional[datetime] = Field(default=None)

class PurchaseRequest(PurchaseRequestBase, table=True):
    __tablename__ = "purchase_request"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    items: List["PurchaseRequestItem"] = Relationship(back_populates="request")

class PurchaseRequestCreate(PurchaseRequestBase):
    pass

class PurchaseRequestRead(PurchaseRequestBase):
    id: str
    created_at: datetime
    updated_at: datetime


# ---------- PurchaseRequestItem ----------

class PurchaseRequestItemBase(SQLModel):
    request_id: str = Field(max_length=36, foreign_key="purchase_request.id", index=True)
    product_id: Optional[str] = Field(default=None, max_length=36)
    product_name: Optional[str] = Field(default=None, max_length=200)
    quantity: int = Field(default=1)
    unit_price: float = Field(default=0.0)
    total: float = Field(default=0.0)
    notes: Optional[str] = Field(default=None)

class PurchaseRequestItem(PurchaseRequestItemBase, table=True):
    __tablename__ = "purchase_request_item"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    request: Optional[PurchaseRequest] = Relationship(back_populates="items")

class PurchaseRequestItemCreate(PurchaseRequestItemBase):
    pass

class PurchaseRequestItemRead(PurchaseRequestItemBase):
    id: str
    created_at: datetime
