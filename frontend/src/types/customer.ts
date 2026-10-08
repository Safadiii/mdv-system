export interface CustomerOverview {
    id: number;
    name: string;
    phone?: string;
    email?: string;

    total_purchases: number;
    total_spent: number;
    last_order?: string;
    active?: boolean;
}

export interface CustomerCreate {
    name: string;
    phone?: string;
    email?: string;
}

export interface CustomerPurchaseItem {
    id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
}

export interface CustomerPurchase {
    id: number;
    invoice_number: string;
    customer_id: number;
    customer: string;
    sale_date: string;
    delivery_date: string | null;
    status: string;
    items: CustomerPurchaseItem[];
    total: number;
}