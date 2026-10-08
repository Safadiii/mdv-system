import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import {
  AlertTriangle,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  Truck,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Download
} from "lucide-react";

import { FileText, Loader2, X } from "lucide-react";
import { downloadInvoice } from "../../../api/invoices";
import api from "../../../api/client";

import {
  exportDatabase
} from "../../../api/dashboard";

import {useState} from "react";
import { useDashboard } from "../../../hooks/useDashboard";
import { fmt$ } from "../utils/Helpers";
import type { Page } from "../types/Page";
import type {
  DashboardPeriodMetric,
  DashboardPendingSalesCard
} from "../../../types/dashboard";
import React from "react";



type InvoiceHistoryActivity = {
  id: number;
  type: "sale" | "purchase";
  reference: string;
  party: string;
  status: string;
  amount: number;
  date: string;
  sortDate: string;
};

type SaleHistoryRow = {
  id: number;
  customer: string;
  invoice_number: string;
  sale_date: string;
  status: string;
  total: number;
};

type PurchaseHistoryRow = {
  id: number;
  invoice_number: string;
  supplier: string;
  purchase_date: string;
  status: string;
  total_cost: number;
};

function formatInvoiceHistoryDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit"
  });
}

const MONO = { fontFamily: "'JetBrains Mono', monospace" };


function formatPercent(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function Trend({ value, label }: { value: number; label: string }) {
  const positive = value >= 0;

  return (
    <div
      className={`flex items-center gap-1 text-[11px] font-medium ${
        positive ? "text-emerald-600" : "text-red-600"
      }`}
    >
      {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {formatPercent(value)}
      <span className="font-normal text-slate-400">{label}</span>
    </div>
  );
}

/* ============================================================ */
/* HERO STAT - featured metrics, shown at the very top          */
/* ============================================================ */

function HeroStat({
  icon,
  iconBg,
  label,
  value,
  monospaceValue = false,
  trendValue,
  trendLabel,
  subtext,
  alert = false
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  monospaceValue?: boolean;
  trendValue?: number;
  trendLabel?: string;
  subtext?: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`bg-white border rounded-lg p-5 flex flex-col gap-3 ${
        alert ? "border-red-200" : "border-slate-200"
      }`}
    >
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-md flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
        <p className="text-[11px] font-medium text-slate-500">{label}</p>
      </div>

      <div>
        <p
          className="text-[26px] leading-none font-semibold text-slate-900"
          style={monospaceValue ? MONO : undefined}
        >
          {value}
        </p>

        <div className="mt-2 min-h-[15px]">
          {trendValue !== undefined ? (
            <Trend value={trendValue} label={trendLabel ?? ""} />
          ) : subtext ? (
            <p className={`text-[11px] ${alert ? "text-red-500" : "text-slate-400"}`}>
              {subtext}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ============================================================ */
/* PERIOD SECTION - week/month breakdown row                    */
/* ============================================================ */

function PeriodSection({
  title,
  metric,
  comparison
}: {
  title: string;
  metric: DashboardPeriodMetric;
  comparison: string;
}) {
  return (
    <div className="border-t border-slate-100 pt-3 first:border-0 first:pt-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] text-slate-400">{title}</p>
          <p className="text-lg font-semibold text-slate-900 mt-0.5">
            {metric.count}
            <span className="text-[11px] font-normal text-slate-400 ml-1">orders</span>
          </p>
        </div>

        <div className="text-right">
          <p className="text-[14px] font-semibold text-slate-900" style={MONO}>
            {fmt$(metric.amount)}
          </p>
          <Trend value={metric.amount_change_pct} label={comparison} />
        </div>
      </div>
    </div>
  );
}

/* ============================================================ */
/* CARD HEADER - shared header row so every card lines up       */
/* ============================================================ */

function CardHeader({
  icon,
  iconBg,
  title,
  badge,
  badgeTone = "neutral"
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  badge?: React.ReactNode;
  badgeTone?: "neutral" | "danger";
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className={`w-8 h-8 rounded-md flex items-center justify-center ${iconBg}`}>
        {icon}
      </div>
      <h3 className="text-[13px] font-semibold text-slate-900">{title}</h3>

      {badge !== undefined && (
        <span
          className={`ml-auto px-2 py-0.5 rounded text-[10px] font-semibold ${
            badgeTone === "danger"
              ? "bg-red-50 text-red-600 border border-red-200"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

/* ============================================================ */
/* PENDING SALES CARD                                            */
/* ============================================================ */

function PendingSalesCard({
  title,
  card,
  icon,
  iconBg
}: {
  title: string;
  card: DashboardPendingSalesCard;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col h-full">
      <CardHeader icon={icon} iconBg={iconBg} title={title} badge={card.count} />

      <div className="mb-4">
        <p className="text-[10px] uppercase tracking-wide text-slate-400">Outstanding value</p>
        <p className="text-xl font-semibold text-slate-900" style={MONO}>
          {fmt$(card.total_amount)}
        </p>
      </div>

      <div className="space-y-2 flex-1">
        {card.sales.length === 0 && (
          <p className="text-[12px] text-slate-400">Nothing pending.</p>
        )}

        {card.sales.map(sale => (
          <div
            key={sale.id}
            className="flex justify-between gap-3 py-2 border-t border-slate-100"
          >
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-slate-800">{sale.invoice_number}</p>
              <p className="text-[10px] text-slate-400 truncate">{sale.customer}</p>
            </div>

            <span className="text-[11px] font-medium text-slate-700 flex-shrink-0" style={MONO}>
              {fmt$(sale.total)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================ */
/* GRAPH CARD                                                     */
/* ============================================================ */

function DashboardGraph({
  title,
  subtitle,
  data,
  stroke,
  gradientId
}: {
  title: string;
  subtitle: string;
  data: { period: string; value: number }[];
  stroke: string;
  gradientId: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5">
      <h3 className="text-[13px] font-semibold text-slate-900">{title}</h3>
      <p className="text-[11px] text-slate-400 mt-0.5 mb-4">{subtitle}</p>

      <ResponsiveContainer width="100%" height={190}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.16} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />

          <XAxis
            dataKey="period"
            tick={{ fontSize: 9, fill: "#94A3B8" }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            tick={{ fontSize: 9, fill: "#94A3B8" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={value => `$${Math.round(Number(value) / 1000)}k`}
          />

          <Tooltip formatter={value => fmt$(Number(value))} />

          <Area
            type="monotone"
            dataKey="value"
            stroke={stroke}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}


/* ============================================================ */
/* PAGE                                                           */
/* ============================================================ */

export default function DashboardPage({ onNav }: { onNav: (p: Page) => void }) {  
  const [
    exporting,
    setExporting
  ] = useState(false);
  const { data, loading, error } = useDashboard();
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceFilter, setInvoiceFilter] = useState<"all" | "sale" | "purchase">("all");
  const [invoiceHistory, setInvoiceHistory] = useState<InvoiceHistoryActivity[]>([]);
  const [invoiceHistoryLoading, setInvoiceHistoryLoading] = useState(false);
  const [invoiceHistoryLoaded, setInvoiceHistoryLoaded] = useState(false);
  const [invoiceHistoryError, setInvoiceHistoryError] = useState<string | null>(null);

  async function fetchAllPurchases(): Promise<PurchaseHistoryRow[]> {
    try {
      const response = await api.get<PurchaseHistoryRow[]>("/purchases");
      return response.data;
    } catch (err: any) {
      // Some versions of the backend use the singular /purchase prefix.
      if (err?.response?.status !== 404) throw err;
      const response = await api.get<PurchaseHistoryRow[]>("/purchase");
      return response.data;
    }
  }

  async function loadInvoiceHistory() {
    if (invoiceHistoryLoading) return;

    try {
      setInvoiceHistoryLoading(true);
      setInvoiceHistoryError(null);

      const [salesResponse, purchases] = await Promise.all([
        api.get<SaleHistoryRow[]>("/sales/sales"),
        fetchAllPurchases()
      ]);

      const sales: InvoiceHistoryActivity[] = salesResponse.data.map(sale => ({
        id: sale.id,
        type: "sale",
        reference: sale.invoice_number,
        party: sale.customer,
        status: String(sale.status),
        amount: Number(sale.total),
        date: formatInvoiceHistoryDate(sale.sale_date),
        sortDate: sale.sale_date
      }));

      const purchaseActivities: InvoiceHistoryActivity[] = purchases.map(purchase => ({
        id: purchase.id,
        type: "purchase",
        reference: purchase.invoice_number,
        party: purchase.supplier,
        status: String(purchase.status),
        amount: Number(purchase.total_cost),
        date: formatInvoiceHistoryDate(purchase.purchase_date),
        sortDate: purchase.purchase_date
      }));

      const allHistory = [...sales, ...purchaseActivities].sort((a, b) => {
        const bTime = Date.parse(b.sortDate);
        const aTime = Date.parse(a.sortDate);

        if (Number.isNaN(aTime) || Number.isNaN(bTime)) {
          return b.id - a.id;
        }

        return bTime - aTime;
      });

      setInvoiceHistory(allHistory);
      setInvoiceHistoryLoaded(true);
    } catch (err) {
      console.error("Failed loading complete invoice history", err);
      setInvoiceHistoryError("Failed to load the complete sales and purchase history.");
    } finally {
      setInvoiceHistoryLoading(false);
    }
  }

  function handleOpenInvoiceModal() {
    setInvoiceModalOpen(true);
    setInvoiceFilter("all");

    if (!invoiceHistoryLoaded) {
      void loadInvoiceHistory();
    }
  }

  async function handleInvoice(type: "sale" | "purchase", id: number) {
    const key = `${type}-${id}`;
    try {
      setDownloadingKey(key);
      await downloadInvoice(type, id);
    } catch (err) {
      console.error("Failed downloading invoice", err);
      alert("Failed to download invoice.");
    } finally {
      setDownloadingKey(null);
    }
  }



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <p className="text-sm text-slate-500 animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
        {error ?? "Dashboard unavailable"}
      </div>
    );
  }

  async function handleExportDatabase() {

    try {

      setExporting(true);

      await exportDatabase();

    } catch (err) {

      console.error(
        "Failed exporting database",
        err
      );

      alert(
        "Failed to export database."
      );

    } finally {

      setExporting(false);

    }

  }

  const outstandingTotal = data.pending_delivery.total_amount + data.pending_payment.total_amount;
  const outstandingCount = data.pending_delivery.count + data.pending_payment.count;
  const lowStockCount = data.low_stock.length;
  const invoiceActivities = invoiceHistory.filter(activity =>
    invoiceFilter === "all" ? true : activity.type === invoiceFilter
  );

  return (
    <div className="space-y-5">

      <div className="flex items-center justify-between">

          <div>

            <h1 className="text-lg font-semibold text-slate-900">

              Dashboard

            </h1>

            <p className="text-[12px] text-slate-400">

              Business overview and activity

            </p>

          </div>


          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenInvoiceModal}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-[12px] font-medium transition-colors"
            >
              <FileText size={14} />
              Generate Invoice
            </button>

            <button
              onClick={handleExportDatabase}
              disabled={exporting}
              className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-700 px-4 py-2 rounded-md text-[12px] font-medium transition-colors"
            >
              <Download size={14} />
              {exporting ? "Exporting..." : "Export Database"}
            </button>
          </div>

        </div>

      {/* ==================================================== */}
      {/* HERO - the numbers that matter most, at a glance      */}
      {/* ==================================================== */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <HeroStat
          icon={<TrendingUp size={15} className="text-emerald-600" />}
          iconBg="bg-emerald-50"
          label="Sales this month"
          value={fmt$(data.sales.month.amount)}
          monospaceValue
          trendValue={data.sales.month.amount_change_pct}
          trendLabel="vs last month"
        />

        <HeroStat
          icon={<ShoppingCart size={15} className="text-amber-600" />}
          iconBg="bg-amber-50"
          label="Purchases this month"
          value={fmt$(data.purchases.month.amount)}
          monospaceValue
          trendValue={data.purchases.month.amount_change_pct}
          trendLabel="vs last month"
        />

        <HeroStat
          icon={<CreditCard size={15} className="text-blue-600" />}
          iconBg="bg-blue-50"
          label="Outstanding"
          value={fmt$(outstandingTotal)}
          monospaceValue
          subtext={`${outstandingCount} order${outstandingCount === 1 ? "" : "s"} pending`}
        />

        <HeroStat
          icon={<AlertTriangle size={15} className={lowStockCount > 0 ? "text-red-500" : "text-slate-400"} />}
          iconBg={lowStockCount > 0 ? "bg-red-50" : "bg-slate-100"}
          label="Low stock alerts"
          value={String(lowStockCount)}
          subtext={lowStockCount > 0 ? "products need reordering" : "All products stocked"}
          alert={lowStockCount > 0}
        />
      </div>

      {/* ==================================================== */}
      {/* DETAIL - cards are paired by shape so rows line up:   */}
      {/* Sales/Purchases share the week+month layout;          */}
      {/* Products/Customers share the simple stat layout.      */}
      {/* ==================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <CardHeader
            icon={<TrendingUp size={15} className="text-emerald-600" />}
            iconBg="bg-emerald-50"
            title="Sales"
          />

          <div className="space-y-3">
            <PeriodSection title="This Week" metric={data.sales.week} comparison="vs last week" />
            <PeriodSection title="This Month" metric={data.sales.month} comparison="vs last month" />
          </div>

          {data.sales.most_selling_product && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <p className="text-[10px] uppercase tracking-wide text-slate-400">
                Most Selling Product
              </p>

              <div className="flex justify-between gap-3 mt-1">
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-slate-800 truncate">
                    {data.sales.most_selling_product.product_name}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {data.sales.most_selling_product.sku}
                  </p>
                </div>

                <span className="text-[12px] font-semibold text-slate-700 flex-shrink-0">
                  {data.sales.most_selling_product.units_sold} units
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <CardHeader
            icon={<ShoppingCart size={15} className="text-amber-600" />}
            iconBg="bg-amber-50"
            title="Purchases"
          />

          <div className="space-y-3">
            <PeriodSection title="This Week" metric={data.purchases.week} comparison="vs last week" />
            <PeriodSection title="This Month" metric={data.purchases.month} comparison="vs last month" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <CardHeader
            icon={<Package size={15} className="text-blue-600" />}
            iconBg="bg-blue-50"
            title="Products"
          />

          <div className="grid grid-cols-2 gap-5">
            <div>
              <p className="text-[11px] text-slate-400">Different Products</p>
              <p className="text-2xl font-semibold text-slate-900">
                {data.products.different_products}
              </p>
            </div>

            <div>
              <p className="text-[11px] text-slate-400">Total Stock</p>
              <p className="text-2xl font-semibold text-slate-900">{data.products.total_stock}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <CardHeader
            icon={<Users size={15} className="text-purple-600" />}
            iconBg="bg-purple-50"
            title="Customers"
          />

          <div>
            <p className="text-[11px] text-slate-400">Total Customers</p>
            <p className="text-2xl font-semibold text-slate-900">
              {data.customers.total_customers}
            </p>
          </div>

          {data.customers.most_active_customer && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <p className="text-[10px] uppercase tracking-wide text-slate-400">
                Most Active Customer
              </p>

              <div className="flex justify-between gap-3 mt-1">
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-slate-800 truncate">
                    {data.customers.most_active_customer.name}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {data.customers.most_active_customer.total_orders} orders
                  </p>
                </div>

                <span className="text-[12px] font-medium text-slate-700 flex-shrink-0" style={MONO}>
                  {fmt$(data.customers.most_active_customer.total_spent)}
                </span>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ==================================================== */}
      {/* NEEDS ATTENTION - low stock + pending sales, grouped  */}
      {/* ==================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col h-full">
          <CardHeader
            icon={<AlertTriangle size={14} className="text-amber-500" />}
            iconBg="bg-amber-50"
            title="Low Stock Alerts"
            badge={lowStockCount}
            badgeTone="danger"
          />

          <div className="space-y-1 flex-1">
            {data.low_stock.length === 0 && (
              <p className="text-[12px] text-slate-400">All products are sufficiently stocked.</p>
            )}

            {data.low_stock.map(product => (
              <div
                key={product.product_id}
                className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0"
              >
                <div
                  className={`w-1 h-9 rounded-full ${
                    product.stock <= 0 ? "bg-red-500" : "bg-amber-400"
                  }`}
                />

                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-slate-800 truncate">
                    {product.brand} {product.model}
                  </p>
                  <p className="text-[10px] text-slate-400" style={MONO}>
                    {product.sku}
                  </p>
                </div>

                <span
                  className={`text-[12px] font-semibold ${
                    product.stock <= 0 ? "text-red-600" : "text-amber-600"
                  }`}
                >
                  {product.stock <= 0 ? "OUT" : product.stock}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNav("inventory")}
            className="mt-4 w-full text-[12px] text-blue-600 hover:text-blue-700 font-medium py-2 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
          >
            View Inventory
          </button>
        </div>

        <PendingSalesCard
          title="Awaiting Delivery"
          card={data.pending_delivery}
          icon={<Truck size={14} className="text-blue-600" />}
          iconBg="bg-blue-50"
        />

        <PendingSalesCard
          title="Awaiting Payment"
          card={data.pending_payment}
          icon={<CreditCard size={14} className="text-amber-600" />}
          iconBg="bg-amber-50"
        />

      </div>

      {/* ==================================================== */}
      {/* GRAPHS                                                 */}
      {/* ==================================================== */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <DashboardGraph
          title="Profit"
          subtitle="Completed sales · last 12 months"
          data={data.profit_chart}
          stroke="#16A34A"
          gradientId="profitGradient"
        />

        <DashboardGraph
          title="Sales"
          subtitle="Non-cancelled sales · last 12 months"
          data={data.sales_chart}
          stroke="#2563EB"
          gradientId="salesGradient"
        />

        <DashboardGraph
          title="Purchases"
          subtitle="Non-cancelled purchases · last 12 months"
          data={data.purchases_chart}
          stroke="#D97706"
          gradientId="purchasesGradient"
        />
      </div>

      {data.profit_is_estimated && (
        <p className="text-[10px] text-slate-400 -mt-2">
          Profit is estimated using each product's current cost price.
        </p>
      )}

      {/* ==================================================== */}
      {/* RECENT ACTIVITY                                        */}
      {/* ==================================================== */}

      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[13px] font-semibold text-slate-900">Recent Activity</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {["Type", "Reference", "Party", "Status", "Amount", "Date", ""].map((header, index) => (
                  <th
                    key={header}
                    className={`pb-2 text-[11px] font-medium text-slate-400 ${
                      index >= 4 ? "text-right" : "text-left"
                    }`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {data.recent_activity.map(activity => (
                <tr
                  key={`${activity.type}-${activity.id}`}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60"
                >
                  <td className="py-2.5">
                    <span
                      className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        activity.type === "sale"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {activity.type === "sale" ? "SALE" : "PURCH"}
                    </span>
                  </td>

                  <td className="py-2.5 text-[12px] text-slate-500" style={MONO}>
                    {activity.reference}
                  </td>

                  <td className="py-2.5 text-[12px] text-slate-800">{activity.party}</td>

                  <td className="py-2.5">
                    <span className="text-[10px] uppercase tracking-wide text-slate-500">
                      {activity.status.replaceAll("_", " ")}
                    </span>
                  </td>

                  <td className="py-2.5 text-[12px] font-medium text-slate-900 text-right" style={MONO}>
                    {fmt$(activity.amount)}
                  </td>

                  <td className="py-2.5 text-[11px] text-slate-400 text-right">{activity.date}</td>
                  <td className="py-2.5 text-right">
                    <button
                      onClick={() => handleInvoice(activity.type, activity.id)}
                      disabled={downloadingKey === `${activity.type}-${activity.id}`}
                      title="Download invoice (PDF)"
                      className="p-1.5 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition-colors"
                    >
                      {downloadingKey === `${activity.type}-${activity.id}`
                        ? <Loader2 size={14} className="animate-spin" />
                        : <FileText size={14} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


      {invoiceModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setInvoiceModalOpen(false);
          }}
        >
          <div className="w-full max-w-4xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-[15px] font-semibold text-slate-900">Generate Invoice</h2>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Choose any previous sale or purchase to generate its PDF invoice.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setInvoiceModalOpen(false)}
                className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close invoice generator"
              >
                <X size={16} />
              </button>
            </div>

            <div className="border-b border-slate-100 px-5 py-3">
              <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5">
                {([
                  ["all", "All"],
                  ["sale", "Sales"],
                  ["purchase", "Purchases"]
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setInvoiceFilter(value)}
                    className={`rounded px-3 py-1.5 text-[11px] font-medium transition-colors ${
                      invoiceFilter === value
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-[65vh] overflow-y-auto">
              {invoiceHistoryLoading ? (
                <div className="flex items-center justify-center gap-2 px-5 py-12 text-slate-500">
                  <Loader2 size={16} className="animate-spin text-blue-600" />
                  <p className="text-[12px]">Loading all previous orders...</p>
                </div>
              ) : invoiceHistoryError ? (
                <div className="px-5 py-10 text-center">
                  <AlertTriangle size={24} className="mx-auto mb-2 text-amber-500" />
                  <p className="text-[12px] text-slate-600">{invoiceHistoryError}</p>
                  <button
                    type="button"
                    onClick={() => void loadInvoiceHistory()}
                    className="mt-3 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
                  >
                    Retry
                  </button>
                </div>
              ) : invoiceActivities.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <FileText size={24} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-[12px] text-slate-500">No orders found.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {invoiceActivities.map(activity => {
                    const key = `${activity.type}-${activity.id}`;
                    const isDownloading = downloadingKey === key;

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleInvoice(activity.type, activity.id)}
                        disabled={isDownloading}
                        className="grid w-full grid-cols-1 gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60 sm:grid-cols-[110px_minmax(0,1.3fr)_minmax(0,1fr)_110px_100px_32px] sm:items-center"
                      >
                        <div>
                          <span
                            className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                              activity.type === "sale"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {activity.type === "sale" ? "SALE" : "PURCHASE"}
                          </span>
                          <p className="mt-1 text-[11px] text-slate-400">{activity.date}</p>
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-[12px] font-semibold text-slate-900" style={MONO}>
                            {activity.reference}
                          </p>
                          <p className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                            {activity.type === "sale" ? "Sales number" : "Purchase number"}
                          </p>
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-[12px] font-medium text-slate-800">{activity.party}</p>
                          <p className="mt-0.5 text-[10px] text-slate-400">
                            {activity.type === "sale" ? "Customer" : "Supplier"}
                          </p>
                        </div>

                        <div>
                          <p className="text-[12px] font-semibold text-slate-900" style={MONO}>
                            {fmt$(activity.amount)}
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-400">Amount</p>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase tracking-wide text-slate-500">
                            {activity.status.replaceAll("_", " ")}
                          </span>
                        </div>

                        <div className="flex justify-end">
                          {isDownloading ? (
                            <Loader2 size={15} className="animate-spin text-blue-600" />
                          ) : (
                            <Download size={15} className="text-slate-400" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-3">
              <p className="text-[10px] text-slate-400">
                Showing {invoiceActivities.length} of {invoiceHistory.length} previous orders
              </p>
              <button
                type="button"
                onClick={() => setInvoiceModalOpen(false)}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}