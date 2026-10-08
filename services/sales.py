from datetime import datetime

from fastapi import HTTPException
from sqlmodel import Session, select

from database.models import (
    Sale,
    SaleItem,
    InventoryMovement,
    MovementType,
    Customer,
    Product,
    SaleStatus,
)

from models.sales import (
    SaleCreate,
    SalesOverview,
    SaleDetail,
    SaleItemDetail,
    SaleUpdate,
)

from services.inventory import get_stock


# ============================================================
# HELPERS
# ============================================================

def generate_invoice_number(session: Session) -> str:
    year = datetime.now().year

    prefix = f"SAL-{year}-"

    statement = (
        select(Sale)
        .order_by(Sale.invoice_number.desc())
    )

    latest_sale = session.exec(statement).first()

    if latest_sale is None:
        next_number = 1
    else:
        last_number = int(
            latest_sale.invoice_number.split("-")[-1]
        )

        next_number = last_number + 1

    return f"{prefix}{next_number:06d}"


def get_quantities_by_product(items) -> dict[int, int]:
    """
    Convert sale items into:

    {
        product_id: total_quantity
    }

    This also handles the case where the same product
    appears in multiple lines.
    """

    quantities: dict[int, int] = {}

    for item in items:

        quantities[item.product_id] = (
            quantities.get(item.product_id, 0)
            + item.quantity
        )

    return quantities


def validate_products(session: Session, items):
    """
    Make sure all products in the sale actually exist.
    """

    for item in items:

        product = session.get(
            Product,
            item.product_id
        )

        if not product:
            raise HTTPException(
                status_code=404,
                detail=f"Product {item.product_id} not found"
            )

        if item.quantity <= 0:
            raise HTTPException(
                status_code=400,
                detail="Sale item quantity must be greater than 0"
            )


def validate_stock(
    session: Session,
    quantities: dict[int, int]
):
    """
    Check that enough inventory exists for the requested
    quantities.
    """

    for product_id, quantity in quantities.items():

        stock = get_stock(
            session,
            product_id
        )

        if stock < quantity:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Not enough stock for product "
                    f"{product_id}. "
                    f"Requested={quantity}, "
                    f"Available={stock}"
                )
            )


def create_inventory_delta(
    session: Session,
    sale_id: int,
    product_id: int,
    delta: int,
    reference_type: str
):
    """
    delta > 0:
        More product is leaving inventory -> SALE

    delta < 0:
        Product is going back into inventory -> RETURN
    """

    if delta > 0:

        session.add(
            InventoryMovement(
                product_id=product_id,
                movement_type=MovementType.SALE,
                quantity=delta,
                reference_type=reference_type,
                reference_id=sale_id,
            )
        )

    elif delta < 0:

        session.add(
            InventoryMovement(
                product_id=product_id,
                movement_type=MovementType.RETURN,
                quantity=abs(delta),
                reference_type=reference_type,
                reference_id=sale_id,
            )
        )


# ============================================================
# CREATE SALE
# ============================================================

def create_sale(
    session: Session,
    data: SaleCreate
):

    customer = session.get(
        Customer,
        data.customer_id
    )

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )


    # Always validate that products exist.
    validate_products(
        session,
        data.items
    )


    quantities = get_quantities_by_product(
        data.items
    )


    # IMPORTANT:
    # Only completed sales affect actual stock.
    if data.status == SaleStatus.COMPLETED:

        validate_stock(
            session,
            quantities
        )


    invoice_number = generate_invoice_number(
        session
    )


    sale = Sale(
        customer_id=data.customer_id,
        invoice_number=invoice_number,

        sale_date=(
            data.sale_date
            if data.sale_date is not None
            else datetime.now()
        ),

        sale_status=data.status
    )


    session.add(sale)

    # Get sale.id without committing.
    session.flush()


    # Create sale item records.
    for item in data.items:

        sale_item = SaleItem(
            sale_id=sale.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            discount_percentage=item.discount_percentage
        )

        session.add(sale_item)


    # Only COMPLETED sales remove inventory.
    if data.status == SaleStatus.COMPLETED:

        for product_id, quantity in quantities.items():

            create_inventory_delta(
                session=session,
                sale_id=sale.id,
                product_id=product_id,
                delta=quantity,
                reference_type="SALE",
            )


    session.commit()
    session.refresh(sale)

    return sale


# ============================================================
# GET SINGLE SALE
# ============================================================

def get_sale(
    session: Session,
    sale_id: int
):

    sale = session.get(
        Sale,
        sale_id
    )

    if not sale:
        raise HTTPException(
            status_code=404,
            detail="Sale not found"
        )

    return sale


# ============================================================
# LIST SALES
# ============================================================

def list_sales(session: Session):

    return session.exec(
        select(Sale)
        .order_by(Sale.sale_date.desc())
    ).all()


def get_sales(session: Session):

    sales = session.exec(
        select(Sale)
        .order_by(Sale.sale_date.desc())
    ).all()

    result = []

    for sale in sales:

        customer = session.get(
            Customer,
            sale.customer_id
        )


        sale_items = session.exec(
            select(SaleItem)
            .where(
                SaleItem.sale_id == sale.id
            )
        ).all()


        item_count = sum(
            item.quantity
            for item in sale_items
        )


        total = sum(
            (
                item.quantity
                * item.unit_price
            )
            * (
                1 - item.discount_percentage / 100
            )
            for item in sale_items
        )


        result.append(
            SalesOverview(
                id=sale.id,

                customer=(
                    customer.name
                    if customer
                    else "Unknown"
                ),

                invoice_number=sale.invoice_number,

                sale_date=(
                    sale.sale_date.strftime(
                        "%Y-%m-%d"
                    )
                ),

                delivery_date=(
                    sale.delivery_date.strftime(
                        "%Y-%m-%d"
                    )
                    if sale.delivery_date
                    else None
                ),

                status=sale.sale_status.value,

                items=item_count,

                total=total
            )
        )

    return result


# ============================================================
# SALE DETAIL
# ============================================================

def get_sale_detail(
    session: Session,
    sale_id: int
):

    sale = session.get(
        Sale,
        sale_id
    )

    if not sale:
        raise HTTPException(
            status_code=404,
            detail="Sale not found"
        )


    customer = session.get(
        Customer,
        sale.customer_id
    )


    sale_items = session.exec(
        select(SaleItem)
        .where(
            SaleItem.sale_id == sale.id
        )
    ).all()


    item_details = []

    total = 0


    for item in sale_items:

        product = session.get(
            Product,
            item.product_id
        )

        line_subtotal = (
            item.quantity
            * item.unit_price
        )

        discount_amount = (
            line_subtotal
            * item.discount_percentage
            / 100
        )

        line_total = (
            line_subtotal
            - discount_amount
        )

        total += line_total


        item_details.append(
            SaleItemDetail(
                id=item.id,

                product_id=item.product_id,

                product_name=(
                    f"{product.brand} {product.model}"
                    if product
                    else "Unknown"
                ),

                quantity=item.quantity,

                unit_price=item.unit_price,

                line_total=line_total,
                line_subtotal=line_subtotal,
                discount_amount=(discount_amount),
                discount_percentage=item.discount_percentage,
            )
        )


    return SaleDetail(
        id=sale.id,

        invoice_number=sale.invoice_number,

        customer_id=sale.customer_id,

        customer=(
            customer.name
            if customer
            else "Unknown"
        ),

        sale_date=(
            sale.sale_date.strftime(
                "%Y-%m-%d"
            )
        ),

        delivery_date=(
            sale.delivery_date.strftime(
                "%Y-%m-%d"
            )
            if sale.delivery_date
            else None
        ),

        status=sale.sale_status.value,

        items=item_details,

        total=total,
    )


# ============================================================
# UPDATE SALE
# ============================================================

def update_sale(
    session: Session,
    sale_id: int,
    data: SaleUpdate
):

    sale = session.get(
        Sale,
        sale_id
    )

    if not sale:
        raise HTTPException(
            status_code=404,
            detail="Sale not found"
        )


    # --------------------------------------------------------
    # IMPORTANT:
    # Keep the previous status BEFORE modifying anything.
    # --------------------------------------------------------

    old_status = sale.sale_status

    new_status = (
        data.status
        if data.status is not None
        else old_status
    )


    # --------------------------------------------------------
    # Get original sale items
    # --------------------------------------------------------

    existing_items = session.exec(
        select(SaleItem)
        .where(
            SaleItem.sale_id == sale.id
        )
    ).all()


    # Inventory state BEFORE the update.
    old_quantities = get_quantities_by_product(
        existing_items
    )


    # --------------------------------------------------------
    # UPDATE ITEMS
    # --------------------------------------------------------

    if data.items is not None:

        validate_products(
            session,
            data.items
        )


        existing_by_id = {
            item.id: item
            for item in existing_items
        }


        # Check that supplied IDs actually belong to this sale.
        for incoming in data.items:

            if (
                incoming.id is not None
                and incoming.id not in existing_by_id
            ):

                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Sale item {incoming.id} "
                        f"does not belong to sale {sale.id}"
                    )
                )


        incoming_ids = {
            item.id
            for item in data.items
            if item.id is not None
        }


        # --------------------------------------------
        # Delete lines that were removed
        # --------------------------------------------

        for existing_item in existing_items:

            if existing_item.id not in incoming_ids:

                session.delete(
                    existing_item
                )


        # --------------------------------------------
        # Update existing / add new
        # --------------------------------------------

        for incoming in data.items:

            if incoming.id is not None:

                existing_item = existing_by_id[
                    incoming.id
                ]

                existing_item.product_id = (
                    incoming.product_id
                )

                existing_item.quantity = (
                    incoming.quantity
                )

                existing_item.unit_price = (
                    incoming.unit_price
                )

                existing_item.discount_percentage=incoming.discount_percentage

                session.add(
                    existing_item
                )

            else:

                new_item = SaleItem(
                    sale_id=sale.id,

                    product_id=(
                        incoming.product_id
                    ),

                    quantity=(
                        incoming.quantity
                    ),

                    unit_price=(
                        incoming.unit_price
                    ),
                    discount_percentage=incoming.discount_percentage,

                )

                session.add(
                    new_item
                )


        # Final inventory requirement after update.
        new_quantities = get_quantities_by_product(
            data.items
        )

    else:

        # Items were not changed.
        new_quantities = old_quantities.copy()


    # ========================================================
    # INVENTORY STATUS LOGIC
    # ========================================================


    # --------------------------------------------------------
    # CASE 1
    #
    # PENDING / CANCELLED
    #        ↓
    # COMPLETED
    #
    # We now actually remove inventory.
    # --------------------------------------------------------

    if (
        old_status != SaleStatus.COMPLETED
        and new_status == SaleStatus.COMPLETED
    ):

        validate_stock(
            session,
            new_quantities
        )


        for (
            product_id,
            quantity
        ) in new_quantities.items():

            create_inventory_delta(
                session=session,
                sale_id=sale.id,
                product_id=product_id,
                delta=quantity,
                reference_type="SALE",
            )


    # --------------------------------------------------------
    # CASE 2
    #
    # COMPLETED
    #      ↓
    # PENDING / CANCELLED
    #
    # Return everything that was previously removed.
    # --------------------------------------------------------

    elif (
        old_status == SaleStatus.COMPLETED
        and new_status != SaleStatus.COMPLETED
    ):

        for (
            product_id,
            quantity
        ) in old_quantities.items():

            create_inventory_delta(
                session=session,
                sale_id=sale.id,
                product_id=product_id,
                delta=-quantity,
                reference_type="SALE_STATUS_REVERSAL",
            )


    # --------------------------------------------------------
    # CASE 3
    #
    # COMPLETED
    #      ↓
    # COMPLETED
    #
    # Sale stays completed, but items may have changed.
    #
    # Only adjust the DIFFERENCE.
    # --------------------------------------------------------

    elif (
        old_status == SaleStatus.COMPLETED
        and new_status == SaleStatus.COMPLETED
    ):

        all_product_ids = (
            set(old_quantities.keys())
            |
            set(new_quantities.keys())
        )


        deltas: dict[int, int] = {}


        for product_id in all_product_ids:

            old_quantity = (
                old_quantities.get(
                    product_id,
                    0
                )
            )

            new_quantity = (
                new_quantities.get(
                    product_id,
                    0
                )
            )


            delta = (
                new_quantity
                - old_quantity
            )


            if delta != 0:
                deltas[product_id] = delta


        # Validate only products where MORE stock
        # is being taken.
        additional_stock_needed = {

            product_id: delta

            for product_id, delta
            in deltas.items()

            if delta > 0
        }


        if additional_stock_needed:

            validate_stock(
                session,
                additional_stock_needed
            )


        # Apply inventory differences.
        for (
            product_id,
            delta
        ) in deltas.items():

            create_inventory_delta(
                session=session,
                sale_id=sale.id,
                product_id=product_id,
                delta=delta,
                reference_type="SALE_ADJUSTMENT",
            )


    # --------------------------------------------------------
    # CASE 4
    #
    # PENDING -> PENDING
    # CANCELLED -> PENDING
    # etc.
    #
    # No inventory movement.
    #
    # Nothing needs to happen here.
    # --------------------------------------------------------


    # ========================================================
    # UPDATE SALE FIELDS
    # ========================================================

    sale.sale_status = new_status


    if data.delivery_date is not None:

        sale.delivery_date = (
            data.delivery_date
        )


    session.add(sale)

    session.commit()

    session.refresh(sale)


    return get_sale_detail(
        session,
        sale_id
    )

def delete_sale(
    session: Session,
    sale_id: int
):

    sale = session.get(
        Sale,
        sale_id
    )

    if not sale:
        raise HTTPException(
            status_code=404,
            detail="Sale not found"
        )


    # Remove every inventory movement created by this sale.
    #
    # This reverses the inventory effect of:
    # - original sale
    # - adjustments
    # - status changes
    movements = session.exec(
        select(InventoryMovement)
        .where(
            InventoryMovement.reference_id == sale.id
        )
        .where(
            InventoryMovement.reference_type.in_([
                "SALE",
                "SALE_ADJUSTMENT",
                "SALE_STATUS_REVERSAL",
            ])
        )
    ).all()


    for movement in movements:
        session.delete(movement)


    # Delete sale items
    sale_items = session.exec(
        select(SaleItem)
        .where(
            SaleItem.sale_id == sale.id
        )
    ).all()


    for item in sale_items:
        session.delete(item)


    # Delete sale itself
    session.delete(sale)


    session.commit()


    return {
        "message": "Sale deleted successfully"
    }