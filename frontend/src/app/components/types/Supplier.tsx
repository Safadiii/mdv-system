export interface Supplier {
  id: string; name: string; phone: string; email: string;
  productsSupplied: number; status: "active" | "inactive";
}