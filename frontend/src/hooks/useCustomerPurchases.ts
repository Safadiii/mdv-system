import { useEffect, useState } from "react";
import { getCustomerPurchase } from "../api/customer";
import type { CustomerPurchase } from "../types/customer";


export function useCustomerPurchases(
    customerId: number | null
) {

    const [purchases, setPurchases] =
        useState<CustomerPurchase[]>([]);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);


    async function fetchPurchases() {

        if (customerId === null) {

            setPurchases([]);
            setError(null);

            return;
        }


        try {

            setLoading(true);
            setError(null);

            const data =
                await getCustomerPurchase(customerId);

            setPurchases(data);

        } catch (err) {

            console.error(err);

            setPurchases([]);

            setError(
                "Failed to load customer purchases"
            );

        } finally {

            setLoading(false);

        }
    }


    useEffect(() => {

        fetchPurchases();

    }, [customerId]);


    return {
        purchases,
        loading,
        error,
        refresh: fetchPurchases
    };
}
