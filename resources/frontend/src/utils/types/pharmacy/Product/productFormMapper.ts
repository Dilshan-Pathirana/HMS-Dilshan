import { Product } from "../../pos/IProduct";

export const mapProductToFormData = (product: Product) => {
    return {
        stepOne: {
            sku: product.item_code || "",
            barcode: product.barcode || "",
            name: product.item_name || "",
            genericName: product.generic_name || "",
            brandName: product.brand_name || "",
            category: product.category || "",
            units: product.unit || "",
        },
        stepTwo: {
            supplier_id: product.supplier_id || "",
        },
        stepThree: {
            warrantySerial: product.warranty_serial || "",
            warrantyDuration: product.warranty_duration || "",
            warrantyStartDate: product.warranty_start_date || "",
            warrantyExpirationDate: product.warranty_end_date || "",
            warrantyType: product.warranty_type || "",
        },
        stepFour: {
            quantityInStock: product.current_stock?.toString() || "",
            minimumStockLevel: product.min_stock?.toString() || "",
            reorderLevel: product.reorder_level?.toString() || "",
            reorderQuantity: product.reorder_quantity?.toString() || "",
            unitCost: product.unit_cost?.toString() || "",
            sellingPrice: product.unit_selling_price?.toString() || "",
            expiryDate: product.expiry_date || "",
            dateOfEntry: product.date_of_entry || "",
            stockStatus: product.stock_status || "",
            stockUpdateDate: product.stock_update_date || "",
            damagedStock: product.damaged_unit?.toString() || "",
            product_store_location: product.product_store_location,
        },
    };
};
