import { useEffect, useState } from "react";
import { getSuppliers } from "../api/supplier";
import type { SupplierOverview } from "../types/supplier";


export function useSuppliers() {

    const [suppliers, setSuppliers] = useState<SupplierOverview[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    async function fetchSuppliers() {

        try {

            setLoading(true);
            setError(null);

            const data = await getSuppliers();

            setSuppliers(data);

        } catch (err) {

            console.error(err);

            setError("Failed to load suppliers");

        } finally {

            setLoading(false);

        }
    }


    useEffect(() => {

        fetchSuppliers();

    }, []);


    return {
        suppliers,
        loading,
        error,
        refresh: fetchSuppliers
    };
}