export interface Product {

    id:number;

    sku:string;

    brand:string;

    model:string;

    cost_price:number;

    selling_price:number;

}



export interface ProductCreate {


    sku:string;

    brand:string;

    model:string;

    cost_price:number;

    selling_price:number;

}

export interface ProductInventory {

    id:number;

    sku:string;

    brand:string;

    model:string;

    cost_price:number;

    selling_price:number;

    stock:number;

}

export interface InventoryOverview {
    id: number;
    sku: string;
    brand: string;
    model: string;

    stock: number;

    incoming: number;
    outgoing: number;

    last_movement: string | null;
}