from pydantic import BaseModel, Field
from sqlmodel import SQLModel
from typing import Optional

class ProductCreate(BaseModel):
    sku: str = Field(min_length=1, max_length=64)
    brand: str = Field(min_length=1, max_length=100)
    model: str = Field(min_length=1, max_length=100)

    cost_price: float = Field(gt=0)
    selling_price: float = Field(gt=0)

class ProductInventoryRead(SQLModel):
    id: int
    sku: str
    brand: str
    model: str

    cost_price: float
    selling_price: float

    stock: int

class ProductUpdate(BaseModel):
    sku: Optional[str] = Field(default=None, min_length=1, max_length=64)
    brand: Optional[str] = Field(default=None, min_length=1, max_length=100)
    model: Optional[str] = Field(default=None, min_length=1, max_length=100)

    cost_price: Optional[float] = Field(default=None, gt=0)
    selling_price: Optional[float] = Field(default=None, gt=0)