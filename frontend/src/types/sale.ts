export interface SaleOverview {
    id:number;
    invoice_number:string;
    customer:string;
    sale_date:string;
    delivery_date:string;
    items:number;
    total:number;
    status:string;
}