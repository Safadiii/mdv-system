import { useInventoryOverview } from "../../../hooks/useInventoryOverview";
import { stockStatus } from "../utils/Helpers";
import { useState } from "react";
import { Search } from "lucide-react";
import { fmtNum } from "../utils/Helpers";
import Badge from "../custom-components/Badge";


export default function InventoryPage() {

  const {
    inventory,
    loading
    } = useInventoryOverview();
    
  const [search, setSearch] = useState("");
  const filtered = inventory.filter(p =>
    [p.brand, p.sku, p.model].some(v => v.toLowerCase().includes(search.toLowerCase()))
  );
  const totalStock = inventory.reduce((s, p) => s + p.stock, 0);


  if(loading)
    return <p>Loading...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search inventory..."
            className="pl-8 pr-3 py-2 text-[13px] bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 placeholder-slate-400 text-slate-900 w-56" />
        </div>
        <div className="ml-auto flex items-center gap-5 text-[11px] text-slate-500">
          {[
            { color: "bg-emerald-500", label: "Healthy (> 8)" },
            { color: "bg-amber-400",   label: "Low (1 – 8)"   },
            { color: "bg-red-500",     label: "Critical (0)"  },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${color} inline-block`} />{label}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {["Brand", "Product", "SKU", "Current Stock", "Incoming", "Outgoing", "Last Movement", "Status"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const s = stockStatus(p.stock);
              const dot = s === "critical" ? "bg-red-500" : s === "low" ? "bg-amber-400" : "bg-emerald-500";
              return (
                <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 text-[13px] font-semibold text-slate-900">{p.brand}</td>
                  <td className="px-4 py-3 text-[13px] text-slate-700">{p.model}</td>
                  <td className="px-4 py-3 text-[12px] text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{p.sku}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                      <span className="text-[13px] font-semibold text-slate-900" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmtNum(p.stock)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-emerald-600 font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>+{p.incoming}</td>
                  <td className="px-4 py-3 text-[13px] text-red-500 font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>-{p.outgoing}</td>
                  <td className="px-4 py-3 text-[12px] text-slate-500">{p.last_movement}</td>
                  <td className="px-4 py-3"><Badge variant={s} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 flex items-center gap-4">
          <p className="text-[11px] text-slate-400">{filtered.length} products</p>
          <p className="text-[11px] text-slate-400">Total stock: <span className="font-semibold text-slate-600" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmtNum(totalStock)}</span> units</p>
        </div>
      </div>
    </div>
  );
}