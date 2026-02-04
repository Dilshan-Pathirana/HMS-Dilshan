import {
    ProductInformationStep,
    StockInformationStep,
    SupplierStepData,
    WarrantyStepData,
} from "./pharmacy/Product/ProdcutCreateForm";

export interface OrderDetails {
    product_id: string;
    qty: number;
    price: number;
    cashier_id: number;
    total_amount: number;
    amount_received: number;
    remain_amount: number;
}

export interface ProductState {
    product_details: ProductInformationStep;
    warranty: WarrantyStepData;
    suppliers: {
        selectedSupplierId: SupplierStepData | null;
    };
    product_stock: StockInformationStep;
}
