import { useEffect, useState } from "react";
import { getCustomers } from "../api/customer";
import type { CustomerOverview } from "../types/customer";


export function useCustomers() {

    const [customers, setCustomers] = useState<CustomerOverview[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    async function fetchCustomers() {

        try {

            setLoading(true);
            setError(null);

            const data = await getCustomers();

            setCustomers(data);

        } catch (err) {

            console.error(err);

            setError("Failed to load customers");

        } finally {

            setLoading(false);

        }
    }


    useEffect(() => {

        fetchCustomers();

    }, []);


    return {
        customers,
        loading,
        error,
        refresh: fetchCustomers
    };
}