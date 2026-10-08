import { useState } from "react";
import Sidebar from "./components/layout/Sidebar";
import Header from "../app/components/layout/Header";
import DashboardPage from "./components/pages/DashboardPage";
import InventoryPage from "./components/pages/InventoryPage";
import SalesPage from "./components/pages/SalesPage";
import ProductsPage from "./components/pages/ProductsPage";
import PurchasesPage from "./components/pages/PurchasesPage";
import CustomersPage from "./components/pages/CustomersPage";
import SuppliersPage from "./components/pages/SuppliersPage";
import ReportsPage from "./components/pages/ReportsPage";
import SettingsPage from "./components/pages/SettingsPage";

// ─── Types ────────────────────────────────────────────────────────────────────

type Page =
  | "dashboard" | "products" | "inventory" | "purchases"
  | "sales" | "customers" | "suppliers" | "reports" | "settings";


// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Sidebar active={page} onNav={setPage} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header page={page} />
        <main className="flex-1 overflow-y-auto p-6">
          {page === "dashboard" && <DashboardPage onNav={setPage} />}
          {page === "products"  && <ProductsPage  />}
          {page === "inventory" && <InventoryPage  />}
          {page === "purchases" && <PurchasesPage  />}
          {page === "sales"     && <SalesPage      />}
          {page === "customers" && <CustomersPage  />}
          {page === "suppliers" && <SuppliersPage  />}
          {page === "reports"   && <ReportsPage    />}
          {page === "settings"  && <SettingsPage   />}
        </main>
      </div>
    </div>
  );
}
