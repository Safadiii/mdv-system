import { useEffect, useState } from "react";

import {
    getInventoryProducts
} from "../api/inventory";

import { ProductInventory } from "../types/product";


export function useInventoryProducts(){
    const [products,setProducts]
        = useState<ProductInventory[]>([]);


    const [loading,setLoading]
        = useState(true);



    const refreshProducts = async () => {
        try {
            setLoading(true);
            const data = await getInventoryProducts();
            setProducts(data);
        } catch(error) {
            console.error(
                "Failed loading products:",
                error
            );
        } finally {
            setLoading(false);
        }
    };
    useEffect(()=>{
        refreshProducts();
    },[]);

    return {
        products,
        loading,
        refreshProducts
    };

}