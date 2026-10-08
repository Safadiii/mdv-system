import {useEffect,useState} from "react";
import {getInventoryOverview} from "../api/inventory";
import { InventoryOverview } from "../types/product";

export function useInventoryOverview(){

    const [inventory,setInventory]
        = useState<InventoryOverview[]>([]);
    const [loading,setLoading]
        = useState(true);
    useEffect(()=>{
        async function load(){
            try{
                const data =
                    await getInventoryOverview();
                setInventory(data);
            }
            finally{
                setLoading(false);
            }
        }
        load();
    },[]);

    return {
        inventory,
        loading
    };
}