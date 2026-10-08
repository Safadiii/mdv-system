from sqlmodel import Session, select, func
from database.models import Product, InventoryMovement, MovementType
from fastapi import HTTPException
from models.inventory import InventoryInitialStockCreate
from sqlmodel import Session, select
from database.models import (
    Product,
    InventoryMovement,
    MovementType
)

def get_stock(session: Session, product_id: int) -> int:
    if session.get(Product, product_id) is None:
        raise HTTPException(status_code=404, detail="Product not found")
    
    movements = session.exec(select(InventoryMovement).where(
        InventoryMovement.product_id == product_id
    )).all()
    
    stock = 0

    for m in movements:
        if m.movement_type == "PURCHASE" or m.movement_type == "RETURN" or m.movement_type == "INITIAL_STOCK":
            stock += m.quantity
        elif m.movement_type == "ADJUSTMENT" or m.movement_type == "SALE" or m.movement_type == "DAMAGE":
            stock -= m.quantity
    
    return stock

def mark_damaged(session: Session, product_id: int, quantity: int):
    movement = InventoryMovement(
        product_id=product_id,
        movement_type=MovementType("DAMAGE"),
        quantity=quantity
    )

    session.add(movement)
    session.commit()

    return movement

def return_product(session: Session, product_id: int, quantity: int):
    movement = InventoryMovement(
        product_id=product_id,
        movement_type=MovementType("RETURN"),
        quantity=quantity
    )

    session.add(movement)
    session.commit()

    return movement

def get_products_with_stock(session: Session):

    products = session.exec(
        select(Product)
    ).all()

    result = []

    for product in products:

        stock = get_stock(session, product.id)

        result.append({
            "id": product.id,

            "sku": product.sku,

            "brand": product.brand,

            "model": product.model,

            "cost_price": product.cost_price,

            "selling_price": product.selling_price,

            "stock": stock
        })

    return result

def create_inventory_initial_stock(
    session: Session,
    adjustment: InventoryInitialStockCreate
):
    product = session.get(Product, adjustment.product_id)
    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )
    movement = InventoryMovement(
        product_id=adjustment.product_id,
        movement_type=MovementType.INITIAL_STOCK,
        quantity=adjustment.quantity,
        reference_type="INITIAL_STOCK"
    )

    session.add(movement)
    session.commit()
    session.refresh(movement)

    return movement




def get_inventory_overview(session: Session):
    products = session.exec(
        select(Product)
    ).all()

    result = []

    for product in products:
        movements = session.exec(
            select(InventoryMovement)
            .where(
                InventoryMovement.product_id == product.id
            )
        ).all()

        incoming = sum(
            m.quantity
            for m in movements
            if m.movement_type in [
                MovementType.PURCHASE,
                MovementType.RETURN,
                MovementType.INITIAL_STOCK
            ]
        )

        outgoing = sum(
            m.quantity
            for m in movements
            if m.movement_type in [
                MovementType.SALE,
                MovementType.DAMAGE
            ]
        )

        stock = incoming - outgoing

        last = None

        if movements:
            last = max(
                m.created_at
                for m in movements
            )

        result.append({
            "id": product.id,
            "sku": product.sku,
            "brand": product.brand,
            "model": product.model,

            "stock": stock,

            "incoming": incoming,
            "outgoing": outgoing,

            "last_movement": (
                last.strftime("%Y-%m-%d")
                if last
                else None
            )
        })

    return result