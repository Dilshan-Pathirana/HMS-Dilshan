export const ProductBasicDetails = {
    sku: "",
    name: "",
    barcode: "",
    genericName: "",
    brandName: "",
    category: "",
    units: "",
};

export const ProductSupplierDetails = { supplier_id: "" };

export const ProductWarrantyDetails = {
    warrantySerial: "",
    warrantyDuration: "",
    warrantyStartDate: "",
    warrantyExpirationDate: "",
    warrantyType: "",
};

export const ProductStockDetails = {
    quantityInStock: "",
    minimumStockLevel: "",
    reorderLevel: "",
    reorderQuantity: "",
    unitCost: "",
    sellingPrice: "",
    expiryDate: "",
    dateOfEntry: "",
    stockStatus: "",
    stockUpdateDate: "",
    damagedStock: "",
    product_store_location: "",
};

export const productSupplierInformationDetails = {
    supplier_name: "",
    contact_person: "",
    contact_number: "",
    contact_email: "",
    supplier_address: "",
    supplier_city: "",
    supplier_country: "",
    supplier_type: "",
    products_supplied: "",
    delivery_time: "",
    payment_terms: "",
    bank_details: "",
    rating: "",
    discounts_agreements: "",
    return_policy: "",
    note: "",
};

export interface SupplierCreateFormProps {
    setIsAddingSupplier: React.Dispatch<React.SetStateAction<boolean>>;
    fetchSuppliers?: () => Promise<void>;
}
