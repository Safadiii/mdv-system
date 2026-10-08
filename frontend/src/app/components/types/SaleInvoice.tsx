export interface SaleInvoice {
  id: string; invoiceNumber: string; customer: string;
  date: string; items: number; total: number; status: "completed" | "pending" | "cancelled";
}