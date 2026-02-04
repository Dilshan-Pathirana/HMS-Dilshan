from typing import Optional
from sqlmodel import SQLModel, Field
from uuid import UUID, uuid4

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

class Branch(BranchBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)

class BranchCreate(BranchBase):
    pass

class BranchRead(BranchBase):
    id: UUID
