from sqlmodel import Session
from database.db import engine, create_db_and_tables
from typing import Optional
from .inventory import return_product, create_purchase, create_sale, get_stock, mark_damaged

from database.models import (
    Product,
    Supplier,
    Customer,
    Purchase,
    PurchaseItem,
    Sale,
    SaleItem,
    InventoryMovement,
    MovementType
)


create_db_and_tables()
session = Session(engine)

product = Product(
    sku="AC-001",
    brand="LG",
    model="DualCool 18000",
    cost_price=500,
    selling_price=700
)

session.add(product)
session.commit()
session.refresh(product)

supplier = Supplier(
    name="LG Distributor",
    phone="123456",
    email="lg@supplier.com"
)

session.add(supplier)
session.commit()
session.refresh(supplier)

customer = Customer(
    name="John Doe",
    phone="999999",
    email="john@test.com"
)

session.add(customer)
session.commit()
session.refresh(customer)

purchase = Purchase(
    supplier_id=supplier.id,
    invoice_number="PO-1001",
    items=[
        PurchaseItem(
            product_id=product.id,
            quantity=10,
            unit_cost=500
        )
    ]
)

create_purchase(session, purchase)

purchase2 = Purchase(
    supplier_id=supplier.id,
    invoice_number="PO-1002",
    items=[
        PurchaseItem(
            product_id=product.id,
            quantity=5,
            unit_cost=520
        )
    ]
)

create_purchase(session, purchase2)

print("Stock after second purchase:", get_stock(session, product.id))

stock = get_stock(session, product.id)
print("Stock after purchase:", stock)

sale = Sale(
    customer_id=customer.id,
    invoice_number="SO-2001",
    items=[
        SaleItem(
            product_id=product.id,
            quantity=3,
            unit_price=700
        )
    ]
)

create_sale(session, sale)

sale2 = Sale(
    customer_id=customer.id,
    invoice_number="SO-2002",
    items=[
        SaleItem(
            product_id=product.id,
            quantity=4,
            unit_price=700
        )
    ]
)

create_sale(session, sale2)

print("Stock after second sale:", get_stock(session, product.id))


try:
    big_sale = Sale(
        customer_id=customer.id,
        invoice_number="SO-9999",
        items=[
            SaleItem(
                product_id=product.id,
                quantity=999,
                unit_price=700
            )
        ]
    )

    create_sale(session, big_sale)

except Exception as e:
    print("Oversell blocked:", e)

product2 = Product(
    sku="AC-002",
    brand="Samsung",
    model="WindFree 12000",
    cost_price=450,
    selling_price=650
)

session.add(product2)
session.commit()
session.refresh(product2)

multi_purchase = Purchase(
    supplier_id=supplier.id,
    invoice_number="PO-2000",
    items=[
        PurchaseItem(product_id=product.id, quantity=2, unit_cost=500),
        PurchaseItem(product_id=product2.id, quantity=3, unit_cost=450),
    ]
)

create_purchase(session, multi_purchase)

print("Stock product 1:", get_stock(session, product.id))
print("Stock product 2:", get_stock(session, product2.id))

sale3 = Sale(
    customer_id=customer.id,
    invoice_number="SO-PROFIT",
    items=[
        SaleItem(
            product_id=product.id,
            quantity=2,
            unit_price=800  # higher margin test
        )
    ]
)

create_sale(session, sale3)

print("Stock product 1 after sell (2):", get_stock(session, product.id))


return_product(session, product.id, 5)

print("Stock after return:", get_stock(session, product.id))

mark_damaged(session, product.id, 2)

print("Stock after damaged (2):", get_stock(session, product.id))




print("\n--- FINAL STOCK CHECK ---")
print(get_stock(session, product.id))