import { ReactNode } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";


interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  trend?: string;
  trendUp?: boolean;
  icon: ReactNode;
  iconBg: string;
}


export default function KpiCard({
  label,
  value,
  sub,
  trend,
  trendUp,
  icon,
  iconBg,
}: KpiCardProps) {

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow">

      <div className="flex items-start justify-between">

        <p className="text-[12px] font-medium text-slate-500 uppercase tracking-wide">
          {label}
        </p>

        <div className={`w-8 h-8 rounded-md flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>

      </div>


      <div>
        <p
          className="text-2xl font-semibold text-slate-900 tracking-tight"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {value}
        </p>

        {sub && (
          <p className="text-[11px] text-slate-400 mt-1">
            {sub}
          </p>
        )}
      </div>


      {trend && (
        <div
          className={`
            flex items-center gap-1
            text-[11px]
            font-medium
            ${trendUp ? "text-emerald-600" : "text-red-500"}
          `}
        >
          {trendUp 
            ? <ArrowUpRight size={12}/>
            : <ArrowDownRight size={12}/>
          }

          {trend}
        </div>
      )}

    </div>
  );
}