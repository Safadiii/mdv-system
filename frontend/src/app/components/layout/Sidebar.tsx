import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  TrendingUp,
  Users,
  Truck,
} from "lucide-react";

import type { Page } from "../types/Page";
import logo from "../../../assets/logo-mdw.png";

const NAV_ITEMS: { id: Page; label: string; icon: typeof Package }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "products",  label: "Products",  icon: Package         },
  { id: "inventory", label: "Inventory", icon: Warehouse        },
  { id: "purchases", label: "Purchases", icon: ShoppingCart     },
  { id: "sales",     label: "Sales",     icon: TrendingUp       },
  { id: "customers", label: "Customers", icon: Users            },
  { id: "suppliers", label: "Suppliers", icon: Truck            },
];

export default function Sidebar({ active, onNav }: { active: Page; onNav: (p: Page) => void }) {
  return (
    <aside className="w-[220px] flex-shrink-0 bg-white border-r border-slate-200 flex flex-col h-screen">
      {/* Logo */}
      <div className="px-5 h-14 flex items-center border-b border-slate-200 flex-shrink-0">
        <img src={logo} alt="MDW" className="h-8 w-auto" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-3 overflow-y-auto">
        <p className="px-2.5 mb-2 text-[10px] font-semibold text-slate-400 tracking-widest uppercase">Main Menu</p>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const on = active === id;
          return (
            <button key={id} onClick={() => onNav(id)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] transition-colors text-left mb-0.5 ${
                on ? "bg-blue-600 text-white font-medium" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}>
              <Icon size={14} className={on ? "opacity-90" : "opacity-50"} />
              {label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}