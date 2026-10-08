export interface PurchaseItemCreate {
    product_id:number;
    quantity:number;
    unit_cost:number;
}


export type PurchaseStatus =
  | "ONGOING"
  | "COMPLETED"
  | "CANCELLED";


export interface PurchaseCreate {
    supplier_id: number;
    delivery_date?: string | null;
    status?: PurchaseStatus;
    items: PurchaseItemCreate[];
}

export interface Purchase {
    id:number;
    invoice_number:string;
    supplier:string;
    purchase_date:string;
    delivery_date:string;
    items:number;
    total_cost:number;
    status:string;
}

export interface PurchaseItemUpdate {
    id?: number | null;
    product_id: number;
    quantity: number;
    unit_cost: number;
}


export interface PurchaseUpdate {
    status?: string;
    delivery_date?: string | null;
    items?: PurchaseItemUpdate[];
}

export interface PurchaseItemDetail {
    id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    unit_cost: number;
    line_total: number;
}


export interface PurchaseDetail {
    id: number;
    invoice_number: string;

    supplier_id: number;
    supplier: string;

    purchase_date: string;
    delivery_date: string | null;

    status: string;

    items: PurchaseItemDetail[];

    total_cost: number;
}