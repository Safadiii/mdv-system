from collections import defaultdict
from datetime import datetime, timedelta

from sqlmodel import Session, select

from database.models import (
    Product,
    Customer,
    Supplier,

    Purchase,
    PurchaseItem,
    PurchaseStatus,

    Sale,
    SaleItem,
    SaleStatus,

    InventoryMovement,
    MovementType,
)

from models.dashboard import (
    DashboardResponse,
    DashboardProductCard,
    DashboardPurchasesCard,
    DashboardSalesCard,
    DashboardCustomersCard,

    DashboardPeriodMetric,
    DashboardTopProduct,
    DashboardTopCustomer,

    DashboardLowStockItem,

    DashboardPendingSale,
    DashboardPendingSalesCard,

    DashboardChartPoint,

    DashboardActivityItem,
)


# ============================================================
# HELPERS
# ============================================================


def percentage_change(
    current: float,
    previous: float
) -> float:

    if previous == 0:

        if current == 0:
            return 0.0

        return 100.0

    return round(
        ((current - previous) / previous) * 100,
        2
    )


def shift_month(
    dt: datetime,
    months: int
) -> datetime:

    month_index = (
        dt.year * 12
        + dt.month
        - 1
        + months
    )

    year, month_zero = divmod(
        month_index,
        12
    )

    return datetime(
        year,
        month_zero + 1,
        1
    )


def sale_item_total(
    item: SaleItem
) -> float:

    subtotal = (
        item.quantity
        * item.unit_price
    )

    discount = (
        subtotal
        * item.discount_percentage
        / 100
    )

    return subtotal - discount


def sale_total(
    sale: Sale,
    items_by_sale: dict
) -> float:

    return sum(
        sale_item_total(item)
        for item in items_by_sale.get(
            sale.id,
            []
        )
    )


def purchase_total(
    purchase: Purchase,
    items_by_purchase: dict
) -> float:

    return sum(
        item.quantity * item.unit_cost
        for item in items_by_purchase.get(
            purchase.id,
            []
        )
    )


def calculate_period_metrics(
    records,
    date_getter,
    amount_getter,

    current_start: datetime,
    current_end: datetime,

    previous_start: datetime,
    previous_end: datetime,
):

    current_records = [
        record
        for record in records
        if (
            current_start
            <= date_getter(record)
            < current_end
        )
    ]


    previous_records = [
        record
        for record in records
        if (
            previous_start
            <= date_getter(record)
            < previous_end
        )
    ]


    current_amount = sum(
        amount_getter(record)
        for record in current_records
    )


    previous_amount = sum(
        amount_getter(record)
        for record in previous_records
    )


    return DashboardPeriodMetric(

        count=len(current_records),

        amount=round(
            current_amount,
            2
        ),

        count_change_pct=
            percentage_change(
                len(current_records),
                len(previous_records)
            ),

        amount_change_pct=
            percentage_change(
                current_amount,
                previous_amount
            ),
    )


# ============================================================
# DASHBOARD
# ============================================================


def get_dashboard(
    session: Session
) -> DashboardResponse:


    # ========================================================
    # LOAD DATA
    # ========================================================

    products = session.exec(
        select(Product)
    ).all()


    customers = session.exec(
        select(Customer)
    ).all()


    suppliers = session.exec(
        select(Supplier)
    ).all()


    purchases = session.exec(
        select(Purchase)
    ).all()


    purchase_items = session.exec(
        select(PurchaseItem)
    ).all()


    sales = session.exec(
        select(Sale)
    ).all()


    sale_items = session.exec(
        select(SaleItem)
    ).all()


    movements = session.exec(
        select(InventoryMovement)
    ).all()


    # ========================================================
    # LOOKUPS
    # ========================================================

    product_lookup = {
        product.id: product
        for product in products
    }


    customer_lookup = {
        customer.id: customer
        for customer in customers
    }


    supplier_lookup = {
        supplier.id: supplier
        for supplier in suppliers
    }


    sale_items_by_sale = defaultdict(list)

    for item in sale_items:

        sale_items_by_sale[
            item.sale_id
        ].append(item)


    purchase_items_by_purchase = defaultdict(list)

    for item in purchase_items:

        purchase_items_by_purchase[
            item.purchase_id
        ].append(item)


    # ========================================================
    # INVENTORY / STOCK
    # ========================================================

    stock_by_product = defaultdict(int)


    incoming_types = {
        MovementType.INITIAL_STOCK,
        MovementType.PURCHASE,
        MovementType.RETURN,
    }


    outgoing_types = {
        MovementType.SALE,
        MovementType.DAMAGE,
    }


    for movement in movements:

        quantity = abs(
            movement.quantity
        )


        if (
            movement.movement_type
            in incoming_types
        ):

            stock_by_product[
                movement.product_id
            ] += quantity


        elif (
            movement.movement_type
            in outgoing_types
        ):

            stock_by_product[
                movement.product_id
            ] -= quantity


        elif (
            movement.movement_type
            == MovementType.ADJUSTMENT
        ):

            # Adjustments are allowed to be
            # positive or negative.

            stock_by_product[
                movement.product_id
            ] += movement.quantity


    total_stock = sum(
        stock_by_product.get(
            product.id,
            0
        )
        for product in products
    )


    product_card = DashboardProductCard(

        different_products=len(
            products
        ),

        total_stock=total_stock,
    )


    # ========================================================
    # VALID SALES / PURCHASES
    # ========================================================

    valid_sales = [
        sale
        for sale in sales
        if (
            sale.sale_status
            != SaleStatus.CANCELLED
        )
    ]


    valid_purchases = [
        purchase
        for purchase in purchases
        if (
            purchase.status
            != PurchaseStatus.CANCELLED
        )
    ]


    # ========================================================
    # DATES
    # ========================================================

    now = datetime.now()


    # ========================================================
    # CURRENT WEEK
    # Monday 00:00 -> now
    # ========================================================

    week_start = (
        now.replace(
            hour=0,
            minute=0,
            second=0,
            microsecond=0
        )
        - timedelta(days=now.weekday())
    )


    # ========================================================
    # PREVIOUS WEEK
    # Previous Monday -> current Monday
    # ========================================================

    previous_week_start = (
        week_start
        - timedelta(days=7)
    )

    previous_week_end = week_start


    # ========================================================
    # CURRENT MONTH
    # First day -> now
    # ========================================================

    month_start = now.replace(
        day=1,
        hour=0,
        minute=0,
        second=0,
        microsecond=0
    )


    # ========================================================
    # PREVIOUS MONTH
    # Previous month's first day -> this month's first day
    # ========================================================

    previous_month_start = shift_month(
        month_start,
        -1
    )

    previous_month_end = month_start


    # ========================================================
    # PURCHASE CARD
    # ========================================================

    purchase_amount = lambda purchase: purchase_total(
        purchase,
        purchase_items_by_purchase
    )


    purchase_week = calculate_period_metrics(

        valid_purchases,

        lambda purchase:
            purchase.purchase_date,

        purchase_amount,

        week_start,
        now,

        previous_week_start,
        previous_week_end,
    )


    purchase_month = calculate_period_metrics(

        valid_purchases,

        lambda purchase:
            purchase.purchase_date,

        purchase_amount,

        month_start,
        now,

        previous_month_start,
        previous_month_end,
    )


    purchase_card = DashboardPurchasesCard(

        week=purchase_week,

        month=purchase_month,
    )


    # ========================================================
    # SALES CARD
    # ========================================================

    sale_amount = lambda sale: sale_total(
        sale,
        sale_items_by_sale
    )


    sale_week = calculate_period_metrics(

        valid_sales,

        lambda sale:
            sale.sale_date,

        sale_amount,

        week_start,
        now,

        previous_week_start,
        previous_week_end,
    )


    sale_month = calculate_period_metrics(

        valid_sales,

        lambda sale:
            sale.sale_date,

        sale_amount,

        month_start,
        now,

        previous_month_start,
        previous_month_end,
    )


    # ========================================================
    # MOST SELLING PRODUCT
    # ========================================================

    product_units = defaultdict(int)

    product_revenue = defaultdict(float)


    valid_sale_ids = {
        sale.id
        for sale in valid_sales
    }


    for item in sale_items:

        if (
            item.sale_id
            not in valid_sale_ids
        ):
            continue


        product_units[
            item.product_id
        ] += item.quantity


        product_revenue[
            item.product_id
        ] += sale_item_total(item)


    most_selling_product = None


    if product_units:

        best_product_id = max(
            product_units,
            key=lambda product_id:
                product_units[
                    product_id
                ]
        )


        product = product_lookup.get(
            best_product_id
        )


        if product:

            most_selling_product = (
                DashboardTopProduct(

                    product_id=product.id,

                    product_name=(
                        f"{product.brand} "
                        f"{product.model}"
                    ),

                    sku=product.sku,

                    units_sold=
                        product_units[
                            best_product_id
                        ],

                    revenue=round(
                        product_revenue[
                            best_product_id
                        ],
                        2
                    ),
                )
            )


    sales_card = DashboardSalesCard(

        week=sale_week,

        month=sale_month,

        most_selling_product=
            most_selling_product,
    )


    # ========================================================
    # CUSTOMER CARD
    # ========================================================

    customer_order_count = defaultdict(int)

    customer_total_spent = defaultdict(float)


    for sale in valid_sales:

        customer_order_count[
            sale.customer_id
        ] += 1


        customer_total_spent[
            sale.customer_id
        ] += sale_total(
            sale,
            sale_items_by_sale
        )


    most_active_customer = None


    if customer_order_count:

        best_customer_id = max(

            customer_order_count,

            key=lambda customer_id: (

                customer_order_count[
                    customer_id
                ],

                customer_total_spent[
                    customer_id
                ],
            )
        )


        customer = customer_lookup.get(
            best_customer_id
        )


        if customer:

            most_active_customer = (
                DashboardTopCustomer(

                    customer_id=
                        customer.id,

                    name=
                        customer.name,

                    total_orders=
                        customer_order_count[
                            best_customer_id
                        ],

                    total_spent=round(
                        customer_total_spent[
                            best_customer_id
                        ],
                        2
                    ),
                )
            )


    customer_card = DashboardCustomersCard(

        total_customers=
            len(customers),

        most_active_customer=
            most_active_customer,
    )


    # ========================================================
    # LOW STOCK
    # ========================================================

    LOW_STOCK_THRESHOLD = 5


    low_stock = []


    for product in products:

        stock = stock_by_product.get(
            product.id,
            0
        )


        if stock <= LOW_STOCK_THRESHOLD:

            low_stock.append(
                DashboardLowStockItem(

                    product_id=
                        product.id,

                    sku=
                        product.sku,

                    brand=
                        product.brand,

                    model=
                        product.model,

                    stock=
                        stock,
                )
            )


    low_stock.sort(
        key=lambda item:
            item.stock
    )


    # Keep the dashboard compact.

    low_stock = low_stock[:8]


    # ========================================================
    # PENDING SALES
    # ========================================================

    def build_pending_card(
        status: SaleStatus
    ):

        pending = [
            sale
            for sale in sales
            if (
                sale.sale_status
                == status
            )
        ]


        pending.sort(
            key=lambda sale:
                sale.sale_date,
            reverse=True
        )


        total_amount = sum(
            sale_total(
                sale,
                sale_items_by_sale
            )
            for sale in pending
        )


        items = []


        for sale in pending[:5]:

            customer = customer_lookup.get(
                sale.customer_id
            )


            items.append(
                DashboardPendingSale(

                    id=sale.id,

                    invoice_number=
                        sale.invoice_number,

                    customer=(
                        customer.name
                        if customer
                        else "Unknown"
                    ),

                    sale_date=
                        sale.sale_date.strftime(
                            "%Y-%m-%d"
                        ),

                    delivery_date=(
                        sale.delivery_date.strftime(
                            "%Y-%m-%d"
                        )
                        if sale.delivery_date
                        else None
                    ),

                    total=round(
                        sale_total(
                            sale,
                            sale_items_by_sale
                        ),
                        2
                    ),
                )
            )


        return DashboardPendingSalesCard(

            count=len(pending),

            total_amount=round(
                total_amount,
                2
            ),

            sales=items,
        )


    pending_delivery = build_pending_card(
        SaleStatus.PENDING_DELIVERY
    )


    pending_payment = build_pending_card(
        SaleStatus.PENDING_PAYMENT
    )


    # ========================================================
    # CHARTS - LAST 12 MONTHS
    # ========================================================

    sales_chart = []

    purchases_chart = []

    profit_chart = []


    first_month = shift_month(
        month_start,
        -11
    )


    for index in range(12):

        period_start = shift_month(
            first_month,
            index
        )


        period_end = shift_month(
            period_start,
            1
        )


        label = period_start.strftime(
            "%b '%y"
        )


        # ---------------------------
        # SALES
        # ---------------------------

        monthly_sales = [
            sale
            for sale in valid_sales
            if (
                period_start
                <= sale.sale_date
                < period_end
            )
        ]


        monthly_sales_total = sum(
            sale_total(
                sale,
                sale_items_by_sale
            )
            for sale in monthly_sales
        )


        sales_chart.append(
            DashboardChartPoint(

                period=label,

                value=round(
                    monthly_sales_total,
                    2
                ),
            )
        )


        # ---------------------------
        # PURCHASES
        # ---------------------------

        monthly_purchases = [
            purchase
            for purchase
            in valid_purchases
            if (
                period_start
                <= purchase.purchase_date
                < period_end
            )
        ]


        monthly_purchase_total = sum(
            purchase_total(
                purchase,
                purchase_items_by_purchase
            )
            for purchase
            in monthly_purchases
        )


        purchases_chart.append(
            DashboardChartPoint(

                period=label,

                value=round(
                    monthly_purchase_total,
                    2
                ),
            )
        )


        # ---------------------------
        # PROFIT
        # ---------------------------
        #
        # Profit is calculated only from
        # COMPLETED sales.
        #
        # Because SaleItem does not store
        # cost-at-sale, Product.cost_price
        # is used as an estimate.
        # ---------------------------

        completed_month_sales = [
            sale
            for sale in sales
            if (
                sale.sale_status
                == SaleStatus.COMPLETED
                and
                period_start
                <= sale.sale_date
                < period_end
            )
        ]


        monthly_profit = 0.0


        for sale in completed_month_sales:

            for item in sale_items_by_sale.get(
                sale.id,
                []
            ):

                product = product_lookup.get(
                    item.product_id
                )


                revenue = sale_item_total(
                    item
                )


                estimated_cost = (

                    product.cost_price
                    * item.quantity

                    if product

                    else 0
                )


                monthly_profit += (
                    revenue
                    - estimated_cost
                )


        profit_chart.append(
            DashboardChartPoint(

                period=label,

                value=round(
                    monthly_profit,
                    2
                ),
            )
        )


    # ========================================================
    # RECENT ACTIVITY
    # ========================================================

    activity = []


    for sale in sales:

        customer = customer_lookup.get(
            sale.customer_id
        )


        activity.append({

            "type": "sale",

            "id": sale.id,

            "reference":
                sale.invoice_number,

            "party": (
                customer.name
                if customer
                else "Unknown"
            ),

            "amount": sale_total(
                sale,
                sale_items_by_sale
            ),

            "date":
                sale.sale_date,

            "status":
                sale.sale_status.value,
        })


    for purchase in purchases:

        supplier = supplier_lookup.get(
            purchase.supplier_id
        )


        activity.append({

            "type": "purchase",

            "id": purchase.id,

            "reference":
                purchase.invoice_number,

            "party": (
                supplier.name
                if supplier
                else "Unknown"
            ),

            "amount": purchase_total(
                purchase,
                purchase_items_by_purchase
            ),

            "date":
                purchase.purchase_date,

            "status":
                purchase.status.value,
        })


    activity.sort(
        key=lambda item:
            item["date"],
        reverse=True
    )


    recent_activity = [

        DashboardActivityItem(

            type=item["type"],

            id=item["id"],

            reference=
                item["reference"],

            party=
                item["party"],

            amount=round(
                item["amount"],
                2
            ),

            date=
                item["date"].strftime(
                    "%Y-%m-%d"
                ),

            status=
                item["status"].lower(),
        )

        for item in activity[:8]
    ]


    # ========================================================
    # RESPONSE
    # ========================================================

    return DashboardResponse(
        products=
            product_card,
        purchases=
            purchase_card,
        sales=
            sales_card,
        customers=
            customer_card,
        low_stock=
            low_stock,
        pending_delivery=
            pending_delivery,
        pending_payment=
            pending_payment,
        profit_chart=
            profit_chart,
        sales_chart=
            sales_chart,
        purchases_chart=
            purchases_chart,
        recent_activity=
            recent_activity,
        profit_is_estimated=True,
    )