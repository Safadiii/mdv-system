import api from "./client";
import type { SupplierOverview, SupplierCreate, SupplierPurchase } from "../types/supplier";


export async function getSuppliers(): Promise<SupplierOverview[]> {

    const response = await api.get<SupplierOverview[]>(
        "/suppliers/"
    );

    return response.data;
}

export async function toggleSupplierStatus(
    supplierId: number
){

    const response = await api.patch(
        `/suppliers/${supplierId}/status`
    );

    return response.data;
}

export async function createSupplier(data: SupplierCreate){

    const response = await api.post(
        "/suppliers/",
        data
    );

    return response.data;

}

export async function getSupplierPurchases(
    supplierId: number
): Promise<SupplierPurchase[]> {

    const response = await api.get(
        `/suppliers/${supplierId}/purchases`
    );

    return response.data;
}