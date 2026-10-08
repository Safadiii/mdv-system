import { Page } from "../types/Page"
import { Search, Bell } from "lucide-react";

const PAGE_TITLES: Record<Page, string> = {
  dashboard: "Dashboard", products: "Products", inventory: "Inventory",
  purchases: "Purchases", sales: "Sales", customers: "Customers",
  suppliers: "Suppliers", reports: "Reports", settings: "Settings",
};

export default function Header({ page }: { page: Page }) {
  return (
    <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center gap-4 flex-shrink-0">
      <h1 className="text-[15px] font-semibold text-slate-900 flex-shrink-0 mr-2">{PAGE_TITLES[page]}</h1>
    </header>
  );
}