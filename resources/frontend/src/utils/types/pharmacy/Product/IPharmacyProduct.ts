import { Column } from "../../common/ITableColumn";
import {Product, SupplierList} from "../../pos/IProduct";

export interface ProductFormData {
    item_code: string;
    item_name: string;
    generic_name?: string;
    brand_name: string;
    category: string;
    subcategory?: string;
    description: string;
    dosage_form?: string;
    strength?: string;
    current_stock: number;
    unit_price: number;
    bulk_price: number;
    manufacture_date: string;
    expiry_date: string;
    product_image?: File;
}

export const columns: Column<Product>[] = [
    { key: "item_code", label: "SKU" },
    { key: "item_name", label: "Name" },
    { key: "barcode", label: "Barcode" },
    { key: "unit_selling_price", label: "Price" },
    { key: "current_stock", label: "Stock" },
    { key: "reorder_level", label: "Reorder Level" },
];

export const columnsForSupplier: Column<SupplierList>[] = [
    { key: "supplier_name", label: "Supplier Name" },
    { key: "contact_person", label: "Contact Person" },
    { key: "contact_number", label: "Contact Number" },
    { key: "contact_email", label: "Contact Email" },
    { key: "supplier_address", label: "Supplier Address" },
    { key: "supplier_city", label: "Supplier City" },
    { key: "supplier_country", label: "Supplier Country" },
    { key: "supplier_type", label: "Supplier Type" },
];

export interface ProductDetailsModalProps {
    isOpen: boolean;
    product: Product | null;
    onClose: () => void;
}

export interface SelectOption {
    label: string;
    value: string;
}

export interface InventoryModalProps {
    product: Product;
    onClose: () => void;
}
