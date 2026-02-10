from sqlmodel import SQLModel, Field, Relationship
from typing import Optional

class DoctorBranchLink(SQLModel, table=True):
    doctor_id: str = Field(foreign_key="doctor.id", primary_key=True)
    branch_id: str = Field(foreign_key="branch.id", primary_key=True)
