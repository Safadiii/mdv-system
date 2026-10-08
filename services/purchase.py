from datetime import datetime

from fastapi import HTTPException
from sqlmodel import select, Session

from database.models import (
    Purchase,
    PurchaseItem,
    InventoryMovement,
    MovementType,
    Supplier,
    Product,
)

from models.purchase import (
    PurchaseCreate,
    PurchaseRead,
    PurchaseDetail,
    PurchaseItemDetail,
    PurchaseUpdate,
)

from services.inventory import get_stock


# ============================================================
# HELPERS
# ============================================================


def generate_invoice_number(
    session: Session
) -> str:

    year = datetime.now().year

    prefix = f"PUR-{year}-"

    statement = (
        select(Purchase)
        .order_by(
            Purchase.invoice_number.desc()
        )
    )

    latest_purchase = (
        session.exec(statement).first()
    )

    if latest_purchase is None:

        next_number = 1

    else:

        last_number = int(
            latest_purchase
            .invoice_number
            .split("-")[-1]
        )

        next_number = last_number + 1

    return (
        f"{prefix}"
        f"{next_number:06d}"
    )


def get_status_value(status) -> str:
    """
    Works whether Purchase.status is stored
    as a string or Python Enum.
    """

    if hasattr(status, "value"):
        return status.value

    return str(status)


def is_completed(status) -> bool:

    return (
        get_status_value(status)
        == "COMPLETED"
    )


def get_quantities_by_product(
    items
) -> dict[int, int]:
    """
    Converts:

    Product A x2
    Product A x3
    Product B x1

    into:

    {
        A: 5,
        B: 1
    }
    """

    quantities: dict[int, int] = {}

    for item in items:

        quantities[item.product_id] = (
            quantities.get(
                item.product_id,
                0
            )
            +
            item.quantity
        )

    return quantities


def validate_products(
    session: Session,
    items
):
    """
    Make sure:
    - product exists
    - quantity is valid
    - unit cost isn't negative
    """

    for item in items:

        product = session.get(
            Product,
            item.product_id
        )

        if not product:

            raise HTTPException(
                status_code=404,
                detail=(
                    f"Product "
                    f"{item.product_id} "
                    f"not found"
                )
            )

        if item.quantity <= 0:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Purchase item quantity "
                    "must be greater than 0"
                )
            )

        if item.unit_cost < 0:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Purchase item unit cost "
                    "cannot be negative"
                )
            )


def validate_inventory_removal(
    session: Session,
    quantities: dict[int, int]
):
    """
    Used when we need to REMOVE inventory
    that was previously added by a purchase.

    Example:

    Purchase added 10.
    Only 3 are currently left.

    We cannot cancel that purchase because
    removing 10 would make inventory negative.
    """

    for (
        product_id,
        quantity
    ) in quantities.items():

        stock = get_stock(
            session,
            product_id
        )

        if stock < quantity:

            raise HTTPException(
                status_code=400,
                detail=(
                    f"Cannot reverse purchase inventory "
                    f"for product {product_id}. "
                    f"Need to remove {quantity}, "
                    f"but only {stock} are available."
                )
            )


def create_purchase_inventory_delta(
    session: Session,
    purchase_id: int,
    product_id: int,
    delta: int,
    reference_type: str
):
    """
    PURCHASE inventory rules:

    delta > 0
        Inventory is being ADDED.

    delta < 0
        Inventory previously added by
        the purchase is being REMOVED.

    This uses PURCHASE for inventory coming in.

    For inventory going back out, it uses
    PURCHASE_REVERSAL if your MovementType
    defines it. Otherwise it falls back to SALE
    so existing get_stock() implementations
    that subtract SALE movements still work.
    """

    if delta > 0:

        session.add(
            InventoryMovement(
                product_id=product_id,
                movement_type=(
                    MovementType.PURCHASE
                ),
                quantity=delta,
                reference_type=reference_type,
                reference_id=purchase_id,
            )
        )

    elif delta < 0:

        reversal_type = getattr(
            MovementType,
            "PURCHASE_REVERSAL",
            MovementType.SALE
        )

        session.add(
            InventoryMovement(
                product_id=product_id,
                movement_type=reversal_type,
                quantity=abs(delta),
                reference_type=reference_type,
                reference_id=purchase_id,
            )
        )


# ============================================================
# CREATE PURCHASE
# ============================================================


def create_purchase(
    session: Session,
    data: PurchaseCreate
):

    # --------------------------------------------------------
    # Validate supplier
    # --------------------------------------------------------

    supplier = session.get(
        Supplier,
        data.supplier_id
    )

    if not supplier:

        raise HTTPException(
            status_code=404,
            detail="Supplier not found"
        )


    # --------------------------------------------------------
    # Validate products
    # --------------------------------------------------------

    validate_products(
        session,
        data.items
    )


    invoice_number = (
        generate_invoice_number(
            session
        )
    )


    # --------------------------------------------------------
    # Create purchase
    # --------------------------------------------------------
    purchase = Purchase(

        supplier_id=
            data.supplier_id,

        invoice_number=
            invoice_number,

        purchase_date=(
            data.purchase_date
            if data.purchase_date
            is not None
            else datetime.now()
        ),

        delivery_date=
            data.delivery_date,

        status=
            data.status,
    )


    session.add(purchase)

    # Gives us purchase.id without committing.
    session.flush()


    # --------------------------------------------------------
    # Create purchase items
    # --------------------------------------------------------

    for item in data.items:

        purchase_item = PurchaseItem(
            purchase_id=purchase.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_cost=item.unit_cost
        )

        session.add(
            purchase_item
        )


    # --------------------------------------------------------
    # If purchase is created directly as COMPLETED,
    # immediately add inventory.
    # --------------------------------------------------------

    if is_completed(data.status):

        quantities = (
            get_quantities_by_product(
                data.items
            )
        )

        for (
            product_id,
            quantity
        ) in quantities.items():

            create_purchase_inventory_delta(
                session=session,
                purchase_id=purchase.id,
                product_id=product_id,
                delta=quantity,
                reference_type="PURCHASE",
            )


    session.commit()

    session.refresh(
        purchase
    )


    return purchase


# ============================================================
# LIST PURCHASES
# ============================================================


def get_purchases(
    session: Session
):

    purchases = session.exec(
        select(Purchase)
        .order_by(
            Purchase.purchase_date.desc()
        )
    ).all()


    result = []


    for purchase in purchases:

        supplier = session.get(
            Supplier,
            purchase.supplier_id
        )


        items = session.exec(
            select(PurchaseItem)
            .where(
                PurchaseItem.purchase_id
                ==
                purchase.id
            )
        ).all()


        # Actual number of units,
        # not number of rows.
        item_count = sum(
            item.quantity
            for item in items
        )


        total_cost = sum(
            item.quantity
            *
            item.unit_cost

            for item in items
        )


        result.append(
            PurchaseRead(
                id=purchase.id,

                invoice_number=(
                    purchase.invoice_number
                ),

                supplier=(
                    supplier.name
                    if supplier
                    else "Unknown"
                ),

                purchase_date=(
                    purchase.purchase_date
                ),

                delivery_date=(
                    purchase.delivery_date
                ),

                status=(
                    get_status_value(
                        purchase.status
                    )
                ),

                items=item_count,

                total_cost=total_cost,
            )
        )


    return result


# ============================================================
# GET SINGLE PURCHASE
# ============================================================


def get_purchase(
    session: Session,
    purchase_id: int
):

    purchase = session.get(
        Purchase,
        purchase_id
    )

    if not purchase:

        raise HTTPException(
            status_code=404,
            detail="Purchase not found"
        )

    return purchase


# ============================================================
# PURCHASE DETAIL
# ============================================================


def get_purchase_detail(
    session: Session,
    purchase_id: int
):

    purchase = session.get(
        Purchase,
        purchase_id
    )

    if not purchase:

        raise HTTPException(
            status_code=404,
            detail="Purchase not found"
        )


    supplier = session.get(
        Supplier,
        purchase.supplier_id
    )


    purchase_items = session.exec(
        select(PurchaseItem)
        .where(
            PurchaseItem.purchase_id
            ==
            purchase.id
        )
    ).all()


    item_details = []

    total_cost = 0


    for item in purchase_items:

        product = session.get(
            Product,
            item.product_id
        )


        line_total = (
            item.quantity
            *
            item.unit_cost
        )


        total_cost += line_total


        item_details.append(
            PurchaseItemDetail(
                id=item.id,

                product_id=(
                    item.product_id
                ),

                product_name=(
                    f"{product.brand} "
                    f"{product.model}"
                    if product
                    else "Unknown"
                ),

                quantity=(
                    item.quantity
                ),

                unit_cost=(
                    item.unit_cost
                ),

                line_total=(
                    line_total
                ),
            )
        )


    return PurchaseDetail(
        id=purchase.id,

        invoice_number=(
            purchase.invoice_number
        ),

        supplier_id=(
            purchase.supplier_id
        ),

        supplier=(
            supplier.name
            if supplier
            else "Unknown"
        ),

        purchase_date=(
            purchase.purchase_date
        ),

        delivery_date=(
            purchase.delivery_date
        ),

        status=(
            get_status_value(
                purchase.status
            )
        ),

        items=item_details,

        total_cost=total_cost,
    )


# ============================================================
# UPDATE PURCHASE
# ============================================================


def update_purchase(
    session: Session,
    purchase_id: int,
    data: PurchaseUpdate
):

    purchase = session.get(
        Purchase,
        purchase_id
    )

    if not purchase:

        raise HTTPException(
            status_code=404,
            detail="Purchase not found"
        )


    # --------------------------------------------------------
    # Keep old status
    # --------------------------------------------------------

    old_status = purchase.status

    new_status = (
        data.status
        if data.status is not None
        else old_status
    )


    old_completed = (
        is_completed(old_status)
    )

    new_completed = (
        is_completed(new_status)
    )


    # --------------------------------------------------------
    # Existing items
    # --------------------------------------------------------

    existing_items = session.exec(
        select(PurchaseItem)
        .where(
            PurchaseItem.purchase_id
            ==
            purchase.id
        )
    ).all()


    old_quantities = (
        get_quantities_by_product(
            existing_items
        )
    )


    # --------------------------------------------------------
    # Determine NEW quantities BEFORE changing database
    # --------------------------------------------------------

    if data.items is not None:

        if len(data.items) == 0:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Purchase must contain "
                    "at least one item"
                )
            )


        validate_products(
            session,
            data.items
        )


        existing_by_id = {
            item.id: item
            for item in existing_items
        }


        # Make sure supplied item IDs
        # actually belong to this purchase.
        for incoming in data.items:

            if (
                incoming.id is not None
                and incoming.id
                not in existing_by_id
            ):

                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Purchase item "
                        f"{incoming.id} "
                        f"does not belong to "
                        f"purchase {purchase.id}"
                    )
                )


        new_quantities = (
            get_quantities_by_product(
                data.items
            )
        )

    else:

        new_quantities = (
            old_quantities.copy()
        )


    # ========================================================
    # VALIDATE INVENTORY BEFORE MAKING CHANGES
    # ========================================================


    # --------------------------------------------------------
    # COMPLETED -> NON-COMPLETED
    #
    # We need to REMOVE all inventory
    # that this purchase previously added.
    # --------------------------------------------------------

    if (
        old_completed
        and not new_completed
    ):

        validate_inventory_removal(
            session,
            old_quantities
        )


    # --------------------------------------------------------
    # COMPLETED -> COMPLETED
    #
    # Only decreases need validation.
    # --------------------------------------------------------

    elif (
        old_completed
        and new_completed
    ):

        all_product_ids = (
            set(
                old_quantities.keys()
            )
            |
            set(
                new_quantities.keys()
            )
        )


        quantities_to_remove = {}


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
                -
                old_quantity
            )


            if delta < 0:

                quantities_to_remove[
                    product_id
                ] = abs(delta)


        if quantities_to_remove:

            validate_inventory_removal(
                session,
                quantities_to_remove
            )


    # ========================================================
    # UPDATE PURCHASE ITEMS
    # ========================================================

    if data.items is not None:

        existing_by_id = {
            item.id: item
            for item in existing_items
        }


        incoming_ids = {
            item.id
            for item in data.items
            if item.id is not None
        }


        # ----------------------------------------------------
        # Delete removed lines
        # ----------------------------------------------------

        for existing_item in existing_items:

            if (
                existing_item.id
                not in incoming_ids
            ):

                session.delete(
                    existing_item
                )


        # ----------------------------------------------------
        # Update existing / add new
        # ----------------------------------------------------

        for incoming in data.items:

            if incoming.id is not None:

                existing_item = (
                    existing_by_id[
                        incoming.id
                    ]
                )


                existing_item.product_id = (
                    incoming.product_id
                )


                existing_item.quantity = (
                    incoming.quantity
                )


                existing_item.unit_cost = (
                    incoming.unit_cost
                )


                session.add(
                    existing_item
                )


            else:

                new_item = PurchaseItem(
                    purchase_id=purchase.id,

                    product_id=(
                        incoming.product_id
                    ),

                    quantity=(
                        incoming.quantity
                    ),

                    unit_cost=(
                        incoming.unit_cost
                    ),
                )


                session.add(
                    new_item
                )


    # ========================================================
    # INVENTORY STATUS LOGIC
    # ========================================================


    # --------------------------------------------------------
    # CASE 1
    #
    # PENDING / CANCELLED
    #         ↓
    # COMPLETED
    #
    # Add purchased inventory.
    # --------------------------------------------------------

    if (
        not old_completed
        and new_completed
    ):

        for (
            product_id,
            quantity
        ) in new_quantities.items():

            create_purchase_inventory_delta(
                session=session,
                purchase_id=purchase.id,
                product_id=product_id,
                delta=quantity,
                reference_type=(
                    "PURCHASE"
                ),
            )


    # --------------------------------------------------------
    # CASE 2
    #
    # COMPLETED
    #      ↓
    # PENDING / CANCELLED
    #
    # Remove inventory that the
    # purchase previously added.
    # --------------------------------------------------------

    elif (
        old_completed
        and not new_completed
    ):

        for (
            product_id,
            quantity
        ) in old_quantities.items():

            create_purchase_inventory_delta(
                session=session,
                purchase_id=purchase.id,
                product_id=product_id,
                delta=-quantity,
                reference_type=(
                    "PURCHASE_STATUS_REVERSAL"
                ),
            )


    # --------------------------------------------------------
    # CASE 3
    #
    # COMPLETED
    #      ↓
    # COMPLETED
    #
    # Purchase stays completed but
    # items may have changed.
    #
    # Only apply the difference.
    # --------------------------------------------------------

    elif (
        old_completed
        and new_completed
    ):

        all_product_ids = (
            set(
                old_quantities.keys()
            )
            |
            set(
                new_quantities.keys()
            )
        )


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
                -
                old_quantity
            )


            if delta != 0:

                create_purchase_inventory_delta(
                    session=session,
                    purchase_id=purchase.id,
                    product_id=product_id,
                    delta=delta,
                    reference_type=(
                        "PURCHASE_ADJUSTMENT"
                    ),
                )


    # --------------------------------------------------------
    # CASE 4
    #
    # PENDING -> PENDING
    # CANCELLED -> PENDING
    # etc.
    #
    # No inventory movement.
    # --------------------------------------------------------


    # ========================================================
    # UPDATE PURCHASE FIELDS
    # ========================================================

    purchase.status = (
        new_status
    )


    if data.delivery_date is not None:

        purchase.delivery_date = (
            data.delivery_date
        )


    session.add(
        purchase
    )


    session.commit()

    session.refresh(
        purchase
    )


    return get_purchase_detail(
        session,
        purchase_id
    )


# ============================================================
# DELETE PURCHASE
# ============================================================


def delete_purchase(
    session: Session,
    purchase_id: int
):

    purchase = session.get(
        Purchase,
        purchase_id
    )

    if not purchase:

        raise HTTPException(
            status_code=404,
            detail="Purchase not found"
        )


    # --------------------------------------------------------
    # Get purchase items
    # --------------------------------------------------------

    purchase_items = session.exec(
        select(PurchaseItem)
        .where(
            PurchaseItem.purchase_id
            ==
            purchase.id
        )
    ).all()


    quantities = (
        get_quantities_by_product(
            purchase_items
        )
    )


    # --------------------------------------------------------
    # If purchase is currently completed,
    # deleting its movements will remove its
    # current stock contribution.
    #
    # Make sure inventory can handle it.
    # --------------------------------------------------------

    if is_completed(
        purchase.status
    ):

        validate_inventory_removal(
            session,
            quantities
        )


    # --------------------------------------------------------
    # Delete inventory movements belonging
    # to this purchase.
    #
    # Since stock is movement-based,
    # removing these movements removes
    # the purchase's historical effect.
    # --------------------------------------------------------

    movements = session.exec(
        select(InventoryMovement)
        .where(
            InventoryMovement.reference_id
            ==
            purchase.id
        )
        .where(
            InventoryMovement.reference_type.in_([
                "PURCHASE",
                "PURCHASE_ADJUSTMENT",
                "PURCHASE_STATUS_REVERSAL",
            ])
        )
    ).all()


    for movement in movements:

        session.delete(
            movement
        )


    # --------------------------------------------------------
    # Delete purchase items
    # --------------------------------------------------------

    for item in purchase_items:

        session.delete(
            item
        )


    # --------------------------------------------------------
    # Delete purchase
    # --------------------------------------------------------

    session.delete(
        purchase
    )


    session.commit()


    return {
        "message":
            "Purchase deleted successfully"
    }