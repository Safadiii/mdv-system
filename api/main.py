from fastapi import FastAPI
from database.db import create_db_and_tables

from api.routes import products, inventory, sales, purchases, customer, suppliers, dashboard, invoices

from fastapi.middleware.cors import CORSMiddleware




app = FastAPI(title="Inventory System API")

create_db_and_tables()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)


app.include_router(products.router)
app.include_router(inventory.router)
app.include_router(sales.router)
app.include_router(purchases.router)
app.include_router(customer.router)
app.include_router(suppliers.router)
app.include_router(dashboard.router)
app.include_router(invoices.router)