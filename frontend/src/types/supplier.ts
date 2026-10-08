export interface SupplierOverview {

    id: number;

    name: string;
    phone?: string;
    email?: string;

    products_supplied: number;

    total_orders: number;

    total_spent: number;

    active: boolean;
}

export interface SupplierCreate {
    name: string;
    phone?: string;
    email?: string;
}

export interface SupplierPurchaseItem {
    id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    unit_cost: number;
    line_total: number;
}

export interface SupplierPurchase {
    id: number;
    invoice_number: string;
    purchase_date: string;
    delivery_date: string | null;
    status: string;
    total: number;
    items: SupplierPurchaseItem[];
}