import { SingleValue } from "react-select";
import { ProductInformationStep } from "../pharmacy/Product/ProdcutCreateForm.ts";
import React from "react";

export interface Product {
    id: string;
    item_code: string;
    barcode: string;
    item_name: string;
    generic_name: string;
    brand_name: string;
    category: string;
    supplier_id: string;
    warranty_serial: string;
    warranty_duration: string;
    warranty_start_date: string;
    warranty_end_date: string;
    warranty_type: string;
    date_of_entry: string;
    stock_status: string;
    stock_update_date: string;
    unit: string;
    current_stock: number;
    min_stock: number;
    reorder_level: number;
    reorder_quantity: number;
    damaged_unit: number;
    unit_cost: number;
    unit_selling_price: number;
    expiry_date: string;
    quantity?: number;
    product_store_location: string;
    discount_type: string;
    discount_percentage?: number;
    discount_amount?: number;
}

export interface SupplierList {
    id: string;
    supplier_name: string;
    contact_person: string;
    contact_number: string;
    contact_email: string;
    supplier_address: string;
    supplier_city: string;
    supplier_country: string;
    supplier_type: string;
}

export interface ProductOptionToDropDown {
    value: string;
    label: string;
}

export interface ReOrderTableProps {
    products: {
        current_stock: number;
        event_reason: string;
        event_type: number;
        id: number;
        previous_stock: number;
        product_id: string;
        stock_related_to_event: number;
        user_id: number;
        item_code: string;
        item_name: string;
    }[];
    searchTerm: string;
    setSearchTerm: (term: string) => void;
}

export interface DamageStockTableProps {
    products: {
        current_stock: number;
        event_reason: string;
        event_type: number;
        id: number;
        previous_stock: number;
        product_id: string;
        stock_related_to_event: number;
        user_id: number;
        item_code: string;
        item_name: string;
    }[];
    searchTerm: string;
    setSearchTerm: (term: string) => void;
}

export interface TransferStockTableProps {
    products: {
        current_stock: number;
        event_reason: string;
        event_type: number;
        id: number;
        previous_stock: number;
        product_id: string;
        stock_related_to_event: number;
        user_id: number;
        item_code: string;
        item_name: string;
    }[];
    searchTerm: string;
    setSearchTerm: (term: string) => void;
}

export interface IProductDiscountTableProps {
    products: IProductDiscount[];
    searchTerm: string;
    setSearchTerm: (term: string) => void;
}

export interface DamageStockFormData {
    quantity: number | string;
    remarks: string;
}

export const DamageStockFormInitialValues = {
    quantity: "",
    remarks: "",
};

export interface DamageStockFormProps {
    productOptions: ProductOptionToDropDown[];
    selectedProduct: SingleValue<ProductOptionToDropDown>;
    onProductChange: (
        selectedOption: SingleValue<ProductOptionToDropDown>,
    ) => void;
    formData: DamageStockFormData;
    onInputChange: (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => void;
    onSubmit: () => void;
    isLoading: boolean;
}

export interface TransferStockFormData {
    quantity: number | string;
    remarks: string;
}

export const TransferStockFormInitialValues = {
    quantity: "",
    remarks: "",
};

export interface TransferStockFormProps {
    productOptions: ProductOptionToDropDown[];
    selectedProduct: SingleValue<ProductOptionToDropDown>;
    onProductChange: (
        selectedOption: SingleValue<ProductOptionToDropDown>,
    ) => void;
    formData: TransferStockFormData;
    onInputChange: (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => void;
    onSubmit: () => void;
    isLoading: boolean;
}

export interface TransferedProduct {
    current_stock: number;
    event_reason: string;
    event_type: number;
    id: number;
    previous_stock: number;
    product_id: string;
    stock_related_to_event: number;
    user_id: number;
    item_code: string;
    item_name: string;
}

export interface ReOrderStockProduct {
    current_stock: number;
    event_reason: string;
    event_type: number;
    id: number;
    previous_stock: number;
    product_id: string;
    stock_related_to_event: number;
    user_id: number;
    item_code: string;
    item_name: string;
}

export interface DamagedProduct {
    current_stock: number;
    event_reason: string;
    event_type: number;
    id: number;
    previous_stock: number;
    product_id: string;
    stock_related_to_event: number;
    user_id: number;
    item_code: string;
    item_name: string;
}

export interface IProductDiscount {
    id: string;
    product_id: string;
    item_name: string;
    item_code: string;
    barcode: string;
    discount_type: string;
    discount_amount: number;
    discount_percentage: number;
}

export interface DamageStockReasonModalProps {
    modalContent: string | null;
    closeModal: () => void;
}

export interface TransferStockReasonModalProps {
    modalContent: string | null;
    closeModal: () => void;
}

export interface ProductInformationFormProps {
    data: ProductInformationStep;
    errors: Record<string, string>;
    setData: React.Dispatch<React.SetStateAction<ProductInformationStep>>;
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    handleSubmit: (event: React.FormEvent) => void;
}

export interface InventoryTableProps {
    products: Product[];
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    onRowClick: (product: Product) => void;
}
