import { Product } from "./IProduct.ts";

export interface Purchasing {
    bill_id: string;
    user_id: string;
    invoice_id: string;
    discount_amount: string;
    total_amount: string;
    net_total: number;
    amount_received: string;
    remain_amount: string;
    products: ProductDetails[];
}

export interface ProductDetails {
    purchase_product_id: string;
    qty: number;
    price: string;
    item_code: string;
    item_name: string;
    generic_name: string;
    brand_name: string;
    category: string;
}

export interface PurchasingModalProps {
    purchasing: Purchasing;
    onClose: () => void;
}

export interface PurchasingTableProps {
    purchasing: Purchasing[] | undefined;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    onRowClick: (purchasing: Purchasing) => void;
}

export interface PurchasingInvoiceProps {
    purchasing: Purchasing;
}

export interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export interface FilterControlsProps {
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    selectedDate: string;
    setSelectedDate: (value: string) => void;
    selectedMonth: string;
    setSelectedMonth: (value: string) => void;
    selectedYear: string;
    setSelectedYear: (value: string) => void;
    setCurrentPage: (page: number) => void;
    exportSelectedRows: () => void;
}

export interface TableProps {
    data: Purchasing[];
    onRowClick: (item: Purchasing) => void;
}

export const fliterningYears = [2022, 2023, 2024, 2025, 2026];

export interface ShoppingCartProps {
    cart: Product[];
    total: number;
    totalDiscount: number;
    netTotal: number;
    isReachedMaximumStock: boolean;
    maximumReachedProduct: string;
    handleUpdateQuantity: (id: string, newQuantity: number) => void;
    handleRemoveFromCart: (id: string) => void;
    onProcessPayment: () => void;
}

export interface SalesBillTotalAmountDetailsProps {
    total: number;
    totalDiscount: number;
    netTotal: number;
}

export interface ShoppingCartTableProps {
    cart: Product[];
    isReachedMaximumStock: boolean;
    maximumReachedProduct: string;
    handleUpdateQuantity: (id: string, newQuantity: number) => void;
    handleRemoveFromCart: (id: string) => void;
    handleInputChange: (id: string, value: string) => void;
}

export interface MaximumStockReachAlertProps {
    itemId: string;
    maximumReachedProduct: string;
    isReachedMaximumStock: boolean;
}

export interface ProductGridProps {
    filteredProducts: Product[];
}
