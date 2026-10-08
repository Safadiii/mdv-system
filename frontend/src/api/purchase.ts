import {
    PurchaseCreate,
    PurchaseUpdate
} from "../types/purchase";

import api from "./client";


export async function createPurchase(
    data: PurchaseCreate
) {

    const response = await api.post(
        "/purchases/",
        data
    );

    return response.data;
}


export async function getPurchases() {

    const response = await api.get(
        "/purchases/"
    );

    return response.data;
}


export async function getPurchase(
    purchaseId: number
) {

    const response = await api.get(
        `/purchases/${purchaseId}`
    );

    return response.data;
}


export async function updatePurchase(
    purchaseId: number,
    data: PurchaseUpdate
) {

    const response = await api.patch(
        `/purchases/${purchaseId}`,
        data
    );

    return response.data;
}


export async function deletePurchase(
    purchaseId: number
) {

    const response = await api.delete(
        `/purchases/${purchaseId}`
    );

    return response.data;
}