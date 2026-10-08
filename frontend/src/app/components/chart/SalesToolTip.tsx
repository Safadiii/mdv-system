import { fmt$
    
 } from "../utils/Helpers";
interface TooltipPayload {
  color: string;
  name: string;
  value: number;
}


interface SalesTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}


export default function SalesTooltip({
  active,
  payload,
  label,
}: SalesTooltipProps) {

  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 shadow-lg">

      <p className="text-[11px] font-semibold text-slate-700 mb-1.5">
        {label}
      </p>

      {payload.map((item, index) => (
        <p
          key={index}
          className="text-[11px]"
          style={{ color: item.color }}
        >
          {item.name}: {fmt$(item.value)}
        </p>
      ))}

    </div>
  );
}