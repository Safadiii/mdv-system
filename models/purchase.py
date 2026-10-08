from pydantic import BaseModel, Field
from typing import List, Optional
from sqlmodel import SQLModel
from datetime import datetime

from database.models import PurchaseStatus


# ============================================================
# CREATE
# ============================================================

class PurchaseItemCreate(BaseModel):
    product_id: int
    quantity: int
    unit_cost: float


class PurchaseCreate(BaseModel):

    supplier_id: int

    items: List[PurchaseItemCreate]

    purchase_date: Optional[datetime] = None

    delivery_date: Optional[datetime] = None

    status: PurchaseStatus = Field(
        default=PurchaseStatus.ONGOING
    )


# ============================================================
# LIST
# ============================================================

class PurchaseRead(SQLModel):
    id: int

    invoice_number: str

    supplier: str

    purchase_date: datetime

    delivery_date: Optional[datetime] = None

    status: PurchaseStatus

    items: int

    total_cost: float


# ============================================================
# DETAIL
# ============================================================

class PurchaseItemDetail(BaseModel):
    id: int

    product_id: int

    product_name: str

    quantity: int

    unit_cost: float

    line_total: float


class PurchaseDetail(BaseModel):
    id: int

    invoice_number: str

    supplier_id: int

    supplier: str

    purchase_date: datetime

    delivery_date: Optional[datetime] = None

    status: PurchaseStatus

    items: List[PurchaseItemDetail]

    total_cost: float


# ============================================================
# UPDATE
# ============================================================

class PurchaseItemUpdate(BaseModel):
    id: Optional[int] = None

    product_id: int

    quantity: int

    unit_cost: float


class PurchaseUpdate(BaseModel):
    status: Optional[PurchaseStatus] = None

    delivery_date: Optional[datetime] = None

    items: Optional[
        List[PurchaseItemUpdate]
    ] = None