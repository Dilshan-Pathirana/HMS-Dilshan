"""HRM Salary & Payroll models – Patch 4.3

Tables: staff_salary, salary_pay, employee_ot
"""
from __future__ import annotations

from datetime import date, datetime
from typing import Optional
from uuid import uuid4

from sqlmodel import Field, SQLModel, Column
from sqlalchemy import Text


# ---------- StaffSalary ----------

class StaffSalaryBase(SQLModel):
    user_id: str = Field(foreign_key="user.id", max_length=36, index=True)
    basic_salary: float = Field(default=0)
    allowances: Optional[str] = Field(default=None, sa_column=Column(Text))  # JSON
    deductions: Optional[str] = Field(default=None, sa_column=Column(Text))  # JSON
    epf_rate: float = Field(default=8.0)
    etf_rate: float = Field(default=3.0)
    effective_from: date


class StaffSalary(StaffSalaryBase, table=True):
    __tablename__ = "staff_salary"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class StaffSalaryCreate(StaffSalaryBase):
    pass


class StaffSalaryRead(StaffSalaryBase):
    id: str
    created_at: datetime


# ---------- SalaryPay ----------

class SalaryPayBase(SQLModel):
    salary_id: str = Field(foreign_key="staff_salary.id", max_length=36, index=True)
    user_id: str = Field(foreign_key="user.id", max_length=36, index=True)
    month: int
    year: int
    gross: float = Field(default=0)
    deductions_total: float = Field(default=0)
    net: float = Field(default=0)
    status: str = Field(default="pending", max_length=20)  # pending/paid
    paid_at: Optional[datetime] = None


class SalaryPay(SalaryPayBase, table=True):
    __tablename__ = "salary_pay"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class SalaryPayCreate(SalaryPayBase):
    pass


class SalaryPayRead(SalaryPayBase):
    id: str
    created_at: datetime


# ---------- EmployeeOT ----------

class EmployeeOTBase(SQLModel):
    user_id: str = Field(foreign_key="user.id", max_length=36, index=True)
    ot_date: date
    hours: float
    rate_multiplier: float = Field(default=1.5)
    approved_by: Optional[str] = Field(default=None, max_length=36)
    status: str = Field(default="pending", max_length=20)  # pending/approved/rejected


class EmployeeOT(EmployeeOTBase, table=True):
    __tablename__ = "employee_ot"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class EmployeeOTCreate(EmployeeOTBase):
    pass


class EmployeeOTRead(EmployeeOTBase):
    id: str
    created_at: datetime
