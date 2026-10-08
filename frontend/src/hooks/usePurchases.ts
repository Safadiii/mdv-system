import { useEffect, useState } from "react";

import {
    getPurchases,
    createPurchase
} from "../api/purchase";

import {
    Purchase,
    PurchaseCreate
} from "../types/purchase";


export function usePurchases(){

    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [loading, setLoading] = useState(true);


    const refreshPurchases = async () => {
        try {
            setLoading(true);

            const data = await getPurchases();

            setPurchases(data);

        } catch(error) {

            console.error(
                "Failed loading purchases:",
                error
            );

        } finally {

            setLoading(false);

        }
    };


    const addPurchase = async (data: PurchaseCreate) => {
        try {
            await createPurchase(data);
            await refreshPurchases();
            return true;
        } catch(error) {
            console.error(
                "Failed creating purchase:",
                error
            );
            return false;
        }
    };


    useEffect(() => {
        refreshPurchases();
    }, []);


    return {
        purchases,
        loading,
        refreshPurchases,
        addPurchase
    };
}