from pydantic import BaseModel, Field
from sqlmodel import SQLModel
from typing import Optional

class InventoryInitialStockCreate(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)


class InventoryOverview(SQLModel):
    id: int
    sku: str
    brand: str
    model: str

    stock: int

    incoming: int
    outgoing: int

    last_movement: Optional[str]