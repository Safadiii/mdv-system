from sqlmodel import SQLModel
from typing import Optional


class SupplierBase(SQLModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None


class SupplierCreate(SupplierBase):
    pass


class SupplierRead(SupplierBase):
    id: int
    active: bool

class SupplierOverview(SQLModel):

    id: int

    name: str
    phone: Optional[str]
    email: Optional[str]

    products_supplied: int

    total_orders: int
    total_spent: float

    active: bool

class SupplierPurchaseItemRead(SQLModel):
    id: int
    product_id: int
    product_name: str
    quantity: int
    unit_cost: float
    line_total: float


class SupplierPurchaseRead(SQLModel):
    id: int
    invoice_number: str
    purchase_date: str
    delivery_date: Optional[str] = None
    status: str
    total: float
    items: list[SupplierPurchaseItemRead]