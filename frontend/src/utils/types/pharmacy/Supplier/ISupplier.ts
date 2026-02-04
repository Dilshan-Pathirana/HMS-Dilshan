import { SupplierList } from "../../pos/IProduct.ts";

export interface SupplierDetailsModalProps {
    isOpen: boolean;
    supplier: SupplierList | null;
    onClose: () => void;
}

export interface SupplierEditModalProps {
    isOpen: boolean;
    supplier: SupplierList | null;
    onClose: () => void;
    onSave: (supplier: SupplierList) => void | Promise<void>;
}
