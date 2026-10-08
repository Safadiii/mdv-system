import api from "./client";
import { InventoryOverview, ProductInventory } from "../types/product";


export async function getInventoryProducts(){

    const response =
        await api.get<ProductInventory[]>(
            "/inventory/products"
        );


    return response.data;

}


export async function createInitialStock(
    product_id:number,
    quantity:number
){

    const response = await api.post(
        "/inventory/initial_stock",
        {
            product_id,
            quantity
        }
    );

    return response.data;
}

export async function getInventoryOverview(){
    const response = await api.get<InventoryOverview[]>(
        "/inventory/overview"
    );
    return response.data;
}