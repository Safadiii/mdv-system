export interface DashboardPeriodMetric {
  count: number;
  amount: number;

  count_change_pct: number;
  amount_change_pct: number;
}


export interface DashboardProductCard {
  different_products: number;
  total_stock: number;
}


export interface DashboardTopProduct {
  product_id: number;

  product_name: string;
  sku: string;

  units_sold: number;
  revenue: number;
}


export interface DashboardPurchasesCard {
  week: DashboardPeriodMetric;
  month: DashboardPeriodMetric;
}


export interface DashboardSalesCard {
  week: DashboardPeriodMetric;
  month: DashboardPeriodMetric;

  most_selling_product:
    DashboardTopProduct | null;
}


export interface DashboardTopCustomer {
  customer_id: number;

  name: string;

  total_orders: number;
  total_spent: number;
}


export interface DashboardCustomersCard {
  total_customers: number;

  most_active_customer:
    DashboardTopCustomer | null;
}


export interface DashboardLowStockItem {
  product_id: number;

  sku: string;
  brand: string;
  model: string;

  stock: number;
}


export interface DashboardPendingSale {
  id: number;

  invoice_number: string;
  customer: string;

  sale_date: string;

  delivery_date: string | null;

  total: number;
}


export interface DashboardPendingSalesCard {
  count: number;

  total_amount: number;

  sales: DashboardPendingSale[];
}


export interface DashboardChartPoint {
  period: string;
  value: number;
}


export interface DashboardActivityItem {
  type: "sale" | "purchase";

  id: number;

  reference: string;

  party: string;

  amount: number;

  date: string;

  status: string;
}


export interface DashboardResponse {

  products:
    DashboardProductCard;

  purchases:
    DashboardPurchasesCard;

  sales:
    DashboardSalesCard;

  customers:
    DashboardCustomersCard;


  low_stock:
    DashboardLowStockItem[];


  pending_delivery:
    DashboardPendingSalesCard;

  pending_payment:
    DashboardPendingSalesCard;


  profit_chart:
    DashboardChartPoint[];

  sales_chart:
    DashboardChartPoint[];

  purchases_chart:
    DashboardChartPoint[];


  recent_activity:
    DashboardActivityItem[];


  profit_is_estimated:
    boolean;
}