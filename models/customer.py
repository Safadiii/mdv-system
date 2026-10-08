from sqlmodel import SQLModel
from typing import Optional


class CustomerBase(SQLModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerRead(CustomerBase):
    id: int
    active: bool

class CustomerOverview(SQLModel):
    id: int
    name: str
    phone: Optional[str]
    email: Optional[str]

    total_purchases: int
    total_spent: float
    last_order: Optional[str]
    active: bool