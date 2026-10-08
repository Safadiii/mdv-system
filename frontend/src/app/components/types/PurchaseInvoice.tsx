export interface PurchaseInvoice {
  id: string; invoiceNumber: string; supplier: string;
  date: string; items: number; total: number; status: "paid" | "pending" | "overdue";
}