import { useState, useCallback } from "react";
import { getSaleDetail, updateSale } from "../api/sale";

export function useSaleDetail() {
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSale = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      setSale(await getSaleDetail(id));
    } catch (e) {
      setError(e.response?.data?.detail || e.message || "Failed to load sale");
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSale = useCallback(async (id, payload) => {
    const data = await updateSale(id, payload);
    setSale(data);
    return data;
  }, []);

  const clearSale = useCallback(() => {
    setSale(null);
    setError(null);
  }, []);

  return { sale, loading, error, fetchSale, saveSale, clearSale };
}