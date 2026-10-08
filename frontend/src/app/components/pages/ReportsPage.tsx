import { ResponsiveContainer, Bar, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area, BarChart } from "recharts";
import SalesTooltip from "../chart/SalesToolTip";
import { CHART_DATA, INV_MOVEMENT, TOP_PRODUCTS } from "../data/data";
import { fmt$ } from "../utils/Helpers";
import BarTooltip from "../chart/BarToolTip";

export default function ReportsPage() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h3 className="text-[13px] font-semibold text-slate-900 mb-0.5">Revenue vs. Procurement Cost</h3>
          <p className="text-[11px] text-slate-400 mb-5">Last 12 months — USD</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={CHART_DATA} margin={{ top: 0, right: 0, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="rG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#2563EB" stopOpacity={0.13} />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity={0}    />
                </linearGradient>
                <linearGradient id="cG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#94A3B8" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="#94A3B8" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={v => `$${v / 1000}k`} />
              <Tooltip content={<SalesTooltip />} />
              <Area type="monotone" dataKey="purchases" name="Cost"    stroke="#94A3B8" strokeWidth={1.5} fill="url(#cG)" />
              <Area type="monotone" dataKey="sales"     name="Revenue" stroke="#2563EB" strokeWidth={2}   fill="url(#rG)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h3 className="text-[13px] font-semibold text-slate-900 mb-0.5">Inventory Movement by Category</h3>
          <p className="text-[11px] text-slate-400 mb-5">Units moved in/out — July 2026</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={INV_MOVEMENT} margin={{ top: 0, right: 0, left: -22, bottom: 0 }} barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="category" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<BarTooltip />} />
              <Bar dataKey="incoming" name="Incoming" fill="#BFDBFE" radius={[2, 2, 0, 0]} />
              <Bar dataKey="outgoing" name="Outgoing" fill="#2563EB" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h3 className="text-[13px] font-semibold text-slate-900 mb-5">Top Products by Revenue — July 2026</h3>
        <div className="space-y-4">
          {TOP_PRODUCTS.map((item, i) => (
            <div key={i} className="flex items-center gap-4">
              <span className="text-[11px] text-slate-400 w-4 text-right flex-shrink-0" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{i + 1}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[13px] text-slate-800">{item.name}</span>
                  <span className="text-[13px] font-medium text-slate-900" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmt$(item.revenue)}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
