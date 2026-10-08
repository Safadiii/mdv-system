import api from "./client";

export type InvoiceType = "sale" | "purchase";

export async function downloadInvoice(type: InvoiceType, id: number) {
  const path = type === "sale" ? "sales" : "purchases";

  const response = await api.get(`/invoices/${path}/${id}`, {
    responseType: "blob",
  });

  const blob = new Blob([response.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);

  let filename = `invoice-${id}.pdf`;
  const disposition = response.headers["content-disposition"];
  const match = disposition?.match(/filename="?([^"]+)"?/);
  if (match?.[1]) filename = match[1];

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}