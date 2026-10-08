import type { BadgeVariant } from "../types/BadgeVariant";


const BADGE_STYLES: Record<BadgeVariant, string> = {
  paid:      "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  healthy:   "bg-emerald-50 text-emerald-700 border-emerald-200",
  ongoing:   "bg-amber-50 text-amber-700 border-amber-200",
  

  pending:   "bg-amber-50 text-amber-700 border-amber-200",
  ONGOING:   "bg-amber-50 text-amber-700 border-amber-200",
  PENDING_DELIVERY:   "bg-blue-50 text-blue-700 border-blue-200",
  PENDING_PAYMENT:   "bg-amber-50 text-amber-700 border-amber-200",
  low:       "bg-amber-50 text-amber-700 border-amber-200",

  overdue:   "bg-red-50 text-red-700 border-red-200",
  critical:  "bg-red-50 text-red-700 border-red-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",

  active:    "bg-blue-50 text-blue-700 border-blue-200",
  inactive:  "bg-slate-100 text-slate-500 border-slate-200",
};


const BADGE_LABELS: Record<BadgeVariant, string> = {
  paid: "Paid",
  completed: "Completed",
  COMPLETED: "COMPLETED",
  healthy: "In Stock",
  ongoing: "Ongoing",

  pending: "Pending",
  ONGOING: "ONGOING",
  PENDING_DELIVERY: "PENDING DELIVERY",
  PENDING_PAYMENT: "PENDING PAYMENT",
  low: "Low Stock",

  overdue: "Overdue",
  critical: "Out of Stock",
  cancelled: "Cancelled",
  CANCELLED : "CANCELLED",

  active: "Active",
  inactive: "Inactive",
};


interface BadgeProps {
  variant: BadgeVariant;
}


export default function Badge({ variant }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center
        px-2 py-0.5
        rounded
        text-[11px]
        font-medium
        border
        ${BADGE_STYLES[variant]}
      `}
    >
      {BADGE_LABELS[variant]}
    </span>
  );
}