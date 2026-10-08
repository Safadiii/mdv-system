import api from "./client";




export interface ProductCreate {
    sku: string;
    brand: string;
    model: string;
    cost_price: number;
    selling_price: number;
}

export interface ProductUpdate {
    sku: string;
    brand: string;
    model: string;
    cost_price: number;
    selling_price: number;
}


export async function createProduct(
    product:ProductCreate
){

    const response = await api.post(
        "/products/",
        product
    );

    return response.data;
}

export async function getProducts(
) {
    const response = await api.get(
        "/products/"
    );
    return response.data;
}

export async function updateProduct(
    productId: number,
    product: ProductUpdate
) {

    const response = await api.patch(
        `/products/${productId}`,
        product
    );

    return response.data;
}