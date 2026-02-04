import React from "react";
import { StockInformationStep } from "../../../../../utils/types/pharmacy/Product/ProdcutCreateForm.ts";
export const validate = (
    data: StockInformationStep,
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>,
) => {
    const newErrors: Record<string, string> = {};
    if (!data.quantityInStock || isNaN(Number(data.quantityInStock))) {
        newErrors.quantityInStock = "This field must be a valid number.";
    }
    if (!data.minimumStockLevel || isNaN(Number(data.minimumStockLevel))) {
        newErrors.minimumStockLevel = "This field must be a valid number.";
    }
    if (!data.reorderLevel || isNaN(Number(data.reorderLevel))) {
        newErrors.reorderLevel = "This field must be a valid number.";
    }
    if (!data.reorderQuantity || isNaN(Number(data.reorderQuantity))) {
        newErrors.reorderQuantity = "This field must be a valid number.";
    }
    if (!data.unitCost || isNaN(Number(data.unitCost))) {
        newErrors.unitCost = "This field is required and must be a number.";
    }
    if (!data.sellingPrice || isNaN(Number(data.sellingPrice))) {
        newErrors.sellingPrice = "This field is required and must be a number.";
    }
    if (!data.expiryDate) {
        newErrors.expiryDate = "This field is required.";
    }
    if (!data.dateOfEntry) {
        newErrors.dateOfEntry = "This field is required.";
    }
    if (!data.stockStatus) {
        newErrors.stockStatus = "This field is required.";
    }
    if (!data.product_store_location) {
        newErrors.product_store_location = "This field is required.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
};
