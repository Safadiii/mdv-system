import api from "./client";
import { CustomerOverview, CustomerCreate, CustomerPurchase } from "../types/customer";


export async function getCustomers(): Promise<CustomerOverview[]> {

    const response = await api.get(
        "/customers/"
    );

    return response.data;
}


export async function createCustomer(
    data: CustomerCreate
) {

    const response = await api.post(
        "/customers/",
        data
    );

    return response.data;
}

export async function toggleCustomerStatus(
    customerId: number
){

    const response = await api.patch(
        `/customers/${customerId}/status`
    );

    return response.data;
}

export async function getCustomerPurchase(
    customerId: number
): Promise<CustomerPurchase[]> {
    const response = await api.get(
        `/customers/${customerId}/purchases`
    );

    return response.data;
}