import api from "./client";

export async function getSales() {
    const response = await api.get("/sales/sales");

    return response.data
}

export async function getSaleDetail(id: number) {
  const response = await api.get(`/sales/${id}`);
  return response.data;
}

export async function updateSale(id: number, payload: any) {
  const response = await api.put(`/sales/${id}`, payload);
  return response.data;
}

export async function deleteSale(
    saleId: number
) {

    const response = await api.delete(
        `/sales/${saleId}`
    );

    return response.data;
}