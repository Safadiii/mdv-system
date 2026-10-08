'''
Class to hold the SQL Tables:

Using an SQLAlchemy Approach with models.
'''
import datetime
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional

from enum import Enum


class MovementType(str, Enum):
    PURCHASE = "PURCHASE"
    SALE = "SALE"
    RETURN = "RETURN"
    ADJUSTMENT = "ADJUSTMENT"
    DAMAGE = "DAMAGE"
    INITIAL_STOCK = "INITIAL_STOCK"

class PurchaseStatus(str, Enum):
    COMPLETED = "COMPLETED"
    ONGOING = "ONGOING"
    CANCELLED = "CANCELLED"

class SaleStatus(str, Enum):
    COMPLETED = "COMPLETED"
    PENDING_PAYMENT = "PENDING_PAYMENT"
    PENDING_DELIVERY = "PENDING_DELIVERY"
    CANCELLED = "CANCELLED"

class Product(SQLModel, table=True):
    '''
    Product:

    id: integer (Primary Key)
    sku: str (used to identify each product)
    brand: str
    model: str
    cost_price: float (Price bought at)
    selling_price: float (Price sold at)

    purchase_items: Relationship handled with supplier
    sale_items: Relationship handled with customer
    movements: relationship handled with Inventory
    '''
    __tablename__: str = "products"
    id: Optional[int] = Field(default=None, primary_key=True)
    sku: str = Field(index=True, unique=True)
    brand: str
    model: str
    cost_price: float
    selling_price: float

    purchase_items: list["PurchaseItem"] = Relationship(back_populates="product")
    sale_items: list["SaleItem"] = Relationship(back_populates="product")
    movements: list["InventoryMovement"] = Relationship(back_populates="product")

class Supplier(SQLModel, table=True):
    '''
    Supplier is what we buy from

    id: Integer (primary key of each supplier)
    name: str (name of supplier)
    phone: str (phone number of supplier)
    email: str (email of supplier)

    purchases: a relationship with product to handle purchasing new products
    '''
    __tablename__: str = "suppliers"

    id: Optional[int] = Field(default=None, primary_key=True)

    name: str 
    phone: Optional[str] = None
    email: Optional[str] = None

    active: bool = Field(default=True)


    purchases: list["Purchase"] = Relationship(back_populates="supplier")

class Customer(SQLModel, table=True):
    '''
    Customers are what buy and purchase from us

    id: integer (primary key of each supplier)
    name: string (Name of the customer)
    phone: str (phone number of the customer)
    email: str (email of the customer)

    sale: relationship to sell to customer
    '''
    __tablename__: str = "customers"

    id: Optional[int] = Field(default=None, primary_key=True)

    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    active: bool = Field(default=True)


    sales: list["Sale"] = Relationship(back_populates="customer")
class Purchase(SQLModel, table=True):
    '''
    Table for each purchase

    id: integer (PK)
    invoice_number: str (invoice number for fatura)
    purchase_date: Date

    supplier: Relationship (handle buying of item)
    item: PurchaseItem entity for each purchase (multiple different items can be bought from one single purchase)
    '''
    __tablename__: str = "purchases"

    id: Optional[int] = Field(default=None, primary_key=True)

    supplier_id: int = Field(foreign_key="suppliers.id")
    invoice_number: str
    purchase_date: datetime.datetime = Field(default_factory=datetime.datetime.now)
    delivery_date: Optional[datetime.datetime] = None
    status: PurchaseStatus = Field(default=PurchaseStatus.ONGOING)

    supplier: Optional[Supplier] = Relationship(back_populates="purchases")
    items: list["PurchaseItem"] = Relationship(back_populates="purchase")

class PurchaseItem(SQLModel, table=True):
    '''
    The entity for purchase table

    id: int (PK)
    purchase_id: int (FK: purchase.id)
    product_id: int (FK: products.id)

    quantity: integer (Number)
    unit_cost: float (price)

    purchase: relationship with purchase
    product: relatinoship with product
    '''
    __tablename__: str = "purchase_items"

    id: Optional[int] = Field(default=None, primary_key=True)

    purchase_id: int = Field(foreign_key="purchases.id")
    product_id: int = Field(foreign_key="products.id")

    quantity: int
    unit_cost: float

    purchase: Optional[Purchase] = Relationship(back_populates="items")
    product: Optional[Product] = Relationship(back_populates="purchase_items")

class Sale(SQLModel, table=True):
    '''
    Table for each sale

    id: integer (PK)
    invoice_number: str (invoice number for fatura)
    sale_date: Date
    customer_id: integer (FK)

    customer: Relationship (handle buying of item)
    item: PurchaseItem entity for each purchase (multiple different items can be bought from one single purchase)
    '''
    __tablename__: str = "sales"

    id: Optional[int] = Field(default=None, primary_key=True)

    customer_id: int = Field(foreign_key="customers.id")
    invoice_number: str
    sale_date: datetime.datetime = Field(default_factory=datetime.datetime.now)
    delivery_date: Optional[datetime.datetime] = None   
    sale_status: SaleStatus = Field(default=SaleStatus.PENDING_PAYMENT)

    customer: Customer | None = Relationship(back_populates="sales")
    items: list["SaleItem"] = Relationship(back_populates="sale")

class SaleItem(SQLModel, table=True):
    '''
    The entity for sales table

    id: int (PK)
    sales_id: int (FK: sales.id)
    product_id: int (FK: products.id)

    quantity: integer (Number)
    unit_price: float (price)

    sale: relationship with sale
    product: relatinoship with product
    '''
    __tablename__: str = "sale_items"

    id: Optional[int] = Field(default=None, primary_key=True)

    sale_id: int = Field(foreign_key="sales.id")
    product_id: int = Field(foreign_key="products.id")

    quantity: int
    unit_price: float
    discount_percentage: float = Field(default=0)

    sale: Sale | None = Relationship(back_populates="items")
    product: Product | None = Relationship(back_populates="sale_items")




class InventoryMovement(SQLModel, table=True):
    '''
    Inventory Movements:

    Purchases may be made but items may have not been delivered yet
    
    id: integer (PK)
    product_id: integer (FK products.id)

    movement_type: enum(PURCHASE, SALE, RETURN, ADJUSTMENT, DAMAGE)
    reference_type: enum(PURCHASE, SALE, NONE)
    reference_id: int (id to refer to)
    quantity: number
    created_at: datetime.datetime object to handle when this was done

    product: relationship
    '''
    __tablename__: str = "inventory_movements"

    id: Optional[int] = Field(default=None, primary_key=True)

    product_id: int = Field(foreign_key="products.id")

    movement_type: MovementType  

    quantity: int

    created_at: datetime.datetime = Field(default_factory=datetime.datetime.now)
    reference_type: Optional[str] = None
    reference_id: Optional[int] = None

    product: Product | None = Relationship(back_populates="movements")
