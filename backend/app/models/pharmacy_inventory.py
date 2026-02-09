"""Pharmacy & Inventory models – Patch 3.2

Tables: product, product_stock, pharmacy_inventory, supplier,
        inventory_batch, pharmacy_stock_transaction,
        daily_purchase_product, prescription
"""
from __future__ import annotations

from datetime import date, datetime
from typing import Optional
from uuid import uuid4

from sqlmodel import Field, SQLModel, Column
from sqlalchemy import Text


# ---------- Product ----------

class ProductBase(SQLModel):
    name: str = Field(max_length=255, index=True)
    generic_name: Optional[str] = Field(default=None, max_length=255)
    category: Optional[str] = Field(default=None, max_length=100)
    unit: Optional[str] = Field(default=None, max_length=50)  # tablet, ml, capsule
    description: Optional[str] = Field(default=None, sa_column=Column(Text))
    supplier_id: Optional[str] = Field(default=None, foreign_key="supplier.id", max_length=36)
    requires_prescription: bool = Field(default=False)
    is_active: bool = Field(default=True)


class Product(ProductBase, table=True):
    __tablename__ = "product"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ProductCreate(ProductBase):
    pass


class ProductRead(ProductBase):
    id: str
    created_at: datetime


# ---------- Supplier ----------

class SupplierBase(SQLModel):
    name: str = Field(max_length=255)
    contact_person: Optional[str] = Field(default=None, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=50)
    email: Optional[str] = Field(default=None, max_length=255)
    address: Optional[str] = Field(default=None, sa_column=Column(Text))
    payment_terms: Optional[str] = Field(default=None, max_length=100)
    is_active: bool = Field(default=True)


class Supplier(SupplierBase, table=True):
    __tablename__ = "supplier"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class SupplierCreate(SupplierBase):
    pass


class SupplierRead(SupplierBase):
    id: str
    created_at: datetime


# ---------- ProductStock ----------

class ProductStockBase(SQLModel):
    product_id: str = Field(foreign_key="product.id", max_length=36, index=True)
    branch_id: str = Field(foreign_key="branch.id", max_length=36, index=True)
    pharmacy_id: Optional[str] = Field(default=None, max_length=36)
    quantity: int = Field(default=0)
    batch_number: Optional[str] = Field(default=None, max_length=100)
    expiry_date: Optional[date] = None
    purchase_price: Optional[float] = None
    selling_price: Optional[float] = None
    reorder_level: int = Field(default=10)


class ProductStock(ProductStockBase, table=True):
    __tablename__ = "product_stock"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None


class ProductStockCreate(ProductStockBase):
    pass


class ProductStockRead(ProductStockBase):
    id: str
    created_at: datetime


# ---------- PharmacyInventory ----------

class PharmacyInventoryBase(SQLModel):
    pharmacy_id: Optional[str] = Field(default=None, max_length=36)
    product_id: str = Field(foreign_key="product.id", max_length=36, index=True)
    quantity: int = Field(default=0)
    batch_no: Optional[str] = Field(default=None, max_length=100)
    expiry_date: Optional[date] = None
    purchase_price: Optional[float] = None
    selling_price: Optional[float] = None
    status: str = Field(default="active", max_length=20)


class PharmacyInventory(PharmacyInventoryBase, table=True):
    __tablename__ = "pharmacy_inventory"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class PharmacyInventoryCreate(PharmacyInventoryBase):
    pass


class PharmacyInventoryRead(PharmacyInventoryBase):
    id: str
    created_at: datetime


# ---------- InventoryBatch ----------

class InventoryBatchBase(SQLModel):
    product_id: str = Field(foreign_key="product.id", max_length=36, index=True)
    pharmacy_id: Optional[str] = Field(default=None, max_length=36)
    batch_no: str = Field(max_length=100)
    received_date: date
    expiry_date: Optional[date] = None
    quantity_received: int
    quantity_remaining: int
    cost_price: Optional[float] = None
    supplier_id: Optional[str] = Field(default=None, foreign_key="supplier.id", max_length=36)


class InventoryBatch(InventoryBatchBase, table=True):
    __tablename__ = "inventory_batch"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class InventoryBatchCreate(InventoryBatchBase):
    pass


class InventoryBatchRead(InventoryBatchBase):
    id: str
    created_at: datetime


# ---------- PharmacyStockTransaction ----------

class PharmacyStockTransactionBase(SQLModel):
    pharmacy_id: Optional[str] = Field(default=None, max_length=36)
    product_id: str = Field(foreign_key="product.id", max_length=36, index=True)
    transaction_type: str = Field(max_length=30)  # purchase/transfer/damage/return/dispense
    quantity: int
    reference_id: Optional[str] = Field(default=None, max_length=36)
    performed_by: str = Field(max_length=36)
    notes: Optional[str] = Field(default=None, sa_column=Column(Text))


class PharmacyStockTransaction(PharmacyStockTransactionBase, table=True):
    __tablename__ = "pharmacy_stock_transaction"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class PharmacyStockTransactionCreate(PharmacyStockTransactionBase):
    pass


class PharmacyStockTransactionRead(PharmacyStockTransactionBase):
    id: str
    created_at: datetime


# ---------- DailyPurchaseProduct ----------

class DailyPurchaseProductBase(SQLModel):
    product_id: str = Field(foreign_key="product.id", max_length=36, index=True)
    supplier_id: Optional[str] = Field(default=None, foreign_key="supplier.id", max_length=36)
    quantity: int
    unit_price: float
    total: float
    purchase_date: date
    invoice_no: Optional[str] = Field(default=None, max_length=100)


class DailyPurchaseProduct(DailyPurchaseProductBase, table=True):
    __tablename__ = "daily_purchase_product"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class DailyPurchaseProductCreate(DailyPurchaseProductBase):
    pass


class DailyPurchaseProductRead(DailyPurchaseProductBase):
    id: str
    created_at: datetime


# ---------- Prescription ----------

class PrescriptionBase(SQLModel):
    consultation_id: Optional[str] = Field(default=None, foreign_key="consultation.id", max_length=36, index=True)
    patient_id: str = Field(foreign_key="patient.id", max_length=36, index=True)
    doctor_id: str = Field(foreign_key="doctor.id", max_length=36)
    items: Optional[str] = Field(default=None, sa_column=Column(Text))  # JSON
    status: str = Field(default="pending", max_length=20)  # pending / dispensed / partial
    dispensed_by: Optional[str] = Field(default=None, max_length=36)
    dispensed_at: Optional[datetime] = None


class Prescription(PrescriptionBase, table=True):
    __tablename__ = "prescription"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, max_length=36)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class PrescriptionCreate(PrescriptionBase):
    pass


class PrescriptionRead(PrescriptionBase):
    id: str
    created_at: datetime
