from fastapi import APIRouter, Depends
from sqlmodel import Session
from database.db import get_session
from services.inventory import get_stock, get_products_with_stock, create_inventory_initial_stock
from models.inventory import InventoryInitialStockCreate
from services.inventory import get_inventory_overview
from models.inventory import InventoryOverview

router = APIRouter(prefix="/inventory", tags=["Inventory"])

@router.get("/stock/{product_id}", status_code=200)
def stock(product_id: int, session: Session = Depends(get_session)):
    return {
        "product_id": product_id,
        "stock": get_stock(session, product_id)
    }

@router.get("/products")
def products_with_stock(
    session: Session = Depends(get_session)
):

    return get_products_with_stock(session)

@router.post("/initial_stock/")
def adjust_inventory(
    data: InventoryInitialStockCreate,
    session: Session = Depends(get_session)
):

    return create_inventory_initial_stock(
        session,
        data
    )

@router.get(
    "/overview",
    response_model=list[InventoryOverview]
)
def inventory_overview(
    session: Session = Depends(get_session)
):

    return get_inventory_overview(session)