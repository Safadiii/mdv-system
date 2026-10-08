from sqlmodel import Session, select
from fastapi import HTTPException

from database.models import Supplier, Purchase, PurchaseItem, Product
from models.suppliers import SupplierCreate, SupplierOverview, SupplierPurchaseItemRead, SupplierPurchaseRead


def create_supplier(
    session: Session,
    data: SupplierCreate
):

    # Check duplicate name
    existing = session.exec(
        select(Supplier).where(
            Supplier.name == data.name
        )
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="A supplier with this name already exists."
        )


    # Check duplicate email
    if data.email:

        existing = session.exec(
            select(Supplier).where(
                Supplier.email == data.email
            )
        ).first()

        if existing:
            raise HTTPException(
                status_code=400,
                detail="A supplier with this email already exists."
            )


    # Check duplicate phone
    if data.phone:

        existing = session.exec(
            select(Supplier).where(
                Supplier.phone == data.phone
            )
        ).first()

        if existing:
            raise HTTPException(
                status_code=400,
                detail="A supplier with this phone number already exists."
            )


    supplier = Supplier.model_validate(data)

    session.add(supplier)
    session.commit()
    session.refresh(supplier)

    return supplier


def get_supplier(session: Session, supplier_id: int):
    supplier = session.get(Supplier, supplier_id)

    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    return supplier

def get_suppliers(session: Session):

    suppliers = session.exec(
        select(Supplier)
        .order_by(Supplier.name)
    ).all()


    result = []


    for supplier in suppliers:

        purchases = session.exec(
            select(Purchase)
            .where(
                Purchase.supplier_id == supplier.id
            )
        ).all()


        total_orders = len(purchases)


        total_spent = 0

        product_ids = set()


        for purchase in purchases:

            items = session.exec(
                select(PurchaseItem)
                .where(
                    PurchaseItem.purchase_id == purchase.id
                )
            ).all()


            for item in items:

                total_spent += (
                    item.quantity *
                    item.unit_cost
                )

                product_ids.add(
                    item.product_id
                )


        result.append(
            SupplierOverview(

                id=supplier.id,

                name=supplier.name,
                phone=supplier.phone,
                email=supplier.email,

                products_supplied=len(product_ids),

                total_orders=total_orders,

                total_spent=total_spent,

                active=supplier.active
            )
        )


    return result

def toggle_supplier_status(
    session: Session,
    supplier_id: int
):

    supplier = session.get(
        Supplier,
        supplier_id
    )

    if not supplier:
        raise HTTPException(
            status_code=404,
            detail="Supplier not found"
        )

    supplier.active = not supplier.active

    session.add(supplier)
    session.commit()
    session.refresh(supplier)

    return supplier

def get_supplier_purchases(
    session: Session,
    supplier_id: int
) -> list[SupplierPurchaseRead]:

    supplier = session.get(Supplier, supplier_id)

    if not supplier:
        raise HTTPException(
            status_code=404,
            detail="Supplier not found"
        )

    purchases = session.exec(
        select(Purchase)
        .where(Purchase.supplier_id == supplier_id)
        .order_by(Purchase.purchase_date.desc())
    ).all()

    result = []

    for purchase in purchases:

        purchase_items = session.exec(
            select(PurchaseItem)
            .where(PurchaseItem.purchase_id == purchase.id)
        ).all()

        items = []
        total = 0.0

        for item in purchase_items:

            product = session.get(
                Product,
                item.product_id
            )

            line_total = (
                item.quantity *
                item.unit_cost
            )

            total += line_total

            product_name = (
                f"{product.brand} {product.model}"
                if product
                else f"Product #{item.product_id}"
            )

            items.append(
                SupplierPurchaseItemRead(
                    id=item.id,
                    product_id=item.product_id,
                    product_name=product_name,
                    quantity=item.quantity,
                    unit_cost=item.unit_cost,
                    line_total=line_total
                )
            )

        result.append(
            SupplierPurchaseRead(
                id=purchase.id,
                invoice_number=purchase.invoice_number,

                purchase_date=
                    purchase.purchase_date.strftime("%Y-%m-%d"),

                delivery_date=(
                    purchase.delivery_date.strftime("%Y-%m-%d")
                    if purchase.delivery_date
                    else None
                ),

                status=purchase.status.value,

                total=total,

                items=items
            )
        )

    return result