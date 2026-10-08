from typing import Optional, Literal
from sqlmodel import SQLModel


class DashboardPeriodMetric(SQLModel):
    count: int
    amount: float

    count_change_pct: float
    amount_change_pct: float


class DashboardProductCard(SQLModel):
    different_products: int
    total_stock: int


class DashboardTopProduct(SQLModel):
    product_id: int
    product_name: str
    sku: str

    units_sold: int
    revenue: float


class DashboardPurchasesCard(SQLModel):
    week: DashboardPeriodMetric
    month: DashboardPeriodMetric


class DashboardSalesCard(SQLModel):
    week: DashboardPeriodMetric
    month: DashboardPeriodMetric

    most_selling_product: Optional[DashboardTopProduct] = None


class DashboardTopCustomer(SQLModel):
    customer_id: int
    name: str

    total_orders: int
    total_spent: float


class DashboardCustomersCard(SQLModel):
    total_customers: int

    most_active_customer: Optional[DashboardTopCustomer] = None


class DashboardLowStockItem(SQLModel):
    product_id: int

    sku: str
    brand: str
    model: str

    stock: int


class DashboardPendingSale(SQLModel):
    id: int

    invoice_number: str
    customer: str

    sale_date: str
    delivery_date: Optional[str] = None

    total: float


class DashboardPendingSalesCard(SQLModel):
    count: int
    total_amount: float

    sales: list[DashboardPendingSale]


class DashboardChartPoint(SQLModel):
    period: str
    value: float


class DashboardActivityItem(SQLModel):
    type: Literal["sale", "purchase"]

    id: int
    reference: str
    party: str

    amount: float
    date: str
    status: str


class DashboardResponse(SQLModel):
    products: DashboardProductCard
    purchases: DashboardPurchasesCard
    sales: DashboardSalesCard
    customers: DashboardCustomersCard
    low_stock: list[DashboardLowStockItem]
    pending_delivery: DashboardPendingSalesCard
    pending_payment: DashboardPendingSalesCard
    profit_chart: list[DashboardChartPoint]
    sales_chart: list[DashboardChartPoint]
    purchases_chart: list[DashboardChartPoint]
    recent_activity: list[DashboardActivityItem]

    profit_is_estimated: bool = True