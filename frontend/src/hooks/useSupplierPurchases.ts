import { useEffect, useState } from "react";
import { getSupplierPurchases } from "../api/supplier";
import type { SupplierPurchase } from "../types/supplier";


export function useSupplierPurchases(
    supplierId: number | null
) {

    const [purchases, setPurchases] =
        useState<SupplierPurchase[]>([]);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);


    useEffect(() => {

        if (supplierId === null) {
            setPurchases([]);
            setLoading(false);
            setError(null);
            return;
        }

        async function fetchPurchases() {

            try {

                setLoading(true);
                setError(null);

                const data =
                    await getSupplierPurchases(supplierId!);

                setPurchases(data);

            } catch (err) {

                console.error(err);

                setError(
                    "Failed to load supplier purchases"
                );

            } finally {

                setLoading(false);

            }
        }

        fetchPurchases();

    }, [supplierId]);


    return {
        purchases,
        loading,
        error
    };
}