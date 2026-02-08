from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from uuid import uuid4

class BranchBase(SQLModel):
    center_name: str = Field(index=True, unique=True, max_length=255)
    register_number: Optional[str] = Field(default=None, unique=True, max_length=255)
    center_type: Optional[str] = Field(default=None, max_length=255)
    division: Optional[str] = Field(default=None, max_length=255)
    division_number: Optional[str] = Field(default=None, max_length=255)
    owner_type: Optional[str] = Field(default=None, max_length=255)
    owner_full_name: Optional[str] = Field(default=None, max_length=255)
    owner_id_number: Optional[str] = Field(default=None, max_length=255)
    owner_contact_number: Optional[str] = Field(default=None, max_length=255)
    register_document: Optional[str] = Field(default=None, description="Path to S3/Local file")
    branch_admin_id: Optional[str] = Field(default=None, foreign_key="user.id", nullable=True)

class Branch(BranchBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    
    pharmacies: List["Pharmacy"] = Relationship(back_populates="branch")

class BranchCreate(BranchBase):
    pass

class BranchRead(BranchBase):
    id: str
