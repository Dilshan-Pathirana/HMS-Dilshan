import React from "react";

export type ProductCreateModalProps = {
    isOpen: boolean;
    onClose: () => void;
    initialData?: {
        stepOne: ProductInformationStep;
        stepTwo: SupplierStepData;
        stepThree: WarrantyStepData;
        stepFour: StockInformationStep;
    };
    isEditing?: boolean;
    productId?: string;
};

export type ProductInformationStep = {
    sku: string;
    name: string;
    barcode: string;
    genericName: string;
    brandName: string;
    category: string;
    units: string;
};

export interface ProductInformationProps {
    data: ProductInformationStep;
    setData: React.Dispatch<React.SetStateAction<ProductInformationStep>>;
    onNext: () => void;
}

export type SupplierStepData = { supplier_id: string };

export interface SupplierStepProps {
    data: SupplierStepData;
    setData: React.Dispatch<React.SetStateAction<{ supplier_id: string }>>;
    onNext: () => void;
    onBack: () => void;
}

export interface Suppliers {
    id: string;
    supplier_name: string;
    value?: string;
}

export interface SelectOption {
    value: string;
    label: string;
}

export interface SupplierOption {
    value: string;
    label: string;
}

export interface Suppliers {
    id: string;
    supplier_name: string;
}

export type WarrantyStepData = {
    warrantySerial: string;
    warrantyDuration: string;
    warrantyStartDate: string;
    warrantyExpirationDate: string;
    warrantyType: string;
};

export interface WarrantyStepProps {
    data: WarrantyStepData;
    setData: React.Dispatch<React.SetStateAction<WarrantyStepData>>;
    onNext: () => void;
    onBack: () => void;
}

export type StockInformationStep = {
    quantityInStock: string;
    minimumStockLevel: string;
    reorderLevel: string;
    reorderQuantity: string;
    unitCost: string;
    sellingPrice: string;
    expiryDate: string;
    dateOfEntry: string;
    stockStatus: string;
    stockUpdateDate: string;
    damagedStock: string;
    product_store_location: string;
    name?: string;
    [key: string]: string | undefined;
};

export interface StockInformationProps {
    isEditing?: boolean;
    data: StockInformationStep;
    setData: React.Dispatch<React.SetStateAction<StockInformationStep>>;
    onBack: () => void;
    productId?: string;
    onSuccess?: () => void;
}

export interface SupplierInfo {
    supplier_name: string;
    contact_person: string;
    contact_number: string;
    contact_email: string;
    supplier_address: string;
    supplier_city: string;
    supplier_country: string;
    supplier_type: string;
    products_supplied: string;
    delivery_time: string;
    payment_terms: string;
    bank_details: string;
    rating: string;
    discounts_agreements: string;
    return_policy: string;
    note: string;
}

export interface ISupplierErrorFields {
    supplier_name: string;
    contact_number: string;
}
