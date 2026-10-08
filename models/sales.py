from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from database.models import SaleStatus
from sqlmodel import SQLModel

class SaleItemCreate(BaseModel):
    product_id: int
    quantity: int
    unit_price: float
    
    discount_percentage: float = Field(
        default=0,
        ge=0,
        le=100
    )


class SaleCreate(BaseModel):
    customer_id: int

    items: List[SaleItemCreate]

    sale_date: Optional[datetime] = None

    status: SaleStatus = Field(
        default=SaleStatus.PENDING_PAYMENT
    )

class SalesOverview(SQLModel):
    id: int
    customer: str
    invoice_number: str
    sale_date: str
    delivery_date: Optional[str]
    status: str
    items: int
    total: float
class SaleItemDetail(BaseModel):
    id: int
    product_id: int
    product_name: str
    quantity: int
    unit_price: float
    line_total: float
    line_subtotal: float
    discount_percentage: float
    discount_amount: float

class SaleDetail(BaseModel):
    id: int
    invoice_number: str
    customer_id: int
    customer: str
    sale_date: str
    delivery_date: Optional[str]
    status: str
    items: List[SaleItemDetail]
    total: float

class SaleItemUpdate(BaseModel):
    id: Optional[int] = None  # existing SaleItem id; None = new line
    product_id: int
    quantity: int
    unit_price: float


    discount_percentage: float = Field(
        default=0,
        ge=0,
        le=100
    )

class SaleUpdate(BaseModel):
    status: Optional[SaleStatus] = None
    delivery_date: Optional[datetime] = None
    items: Optional[List[SaleItemUpdate]] = None