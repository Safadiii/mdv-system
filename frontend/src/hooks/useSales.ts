import { useEffect, useState } from "react";

import {
    getSales
} from "../api/sale";

import {
    SaleOverview
} from "../types/sale";


export function useSales(){

    const [sales, setSales] = useState<SaleOverview[]>([]);
    const [loading, setLoading] = useState(true);


    const refreshSales = async () => {
        try {
            setLoading(true);

            const data = await getSales();

            setSales(data);

        } catch(error) {

            console.error(
                "Failed loading sales:",
                error
            );

        } finally {

            setLoading(false);

        }
    };




    useEffect(() => {
        refreshSales();
    }, []);


    return {
        sales,
        loading,
        refreshSales,
    };
}