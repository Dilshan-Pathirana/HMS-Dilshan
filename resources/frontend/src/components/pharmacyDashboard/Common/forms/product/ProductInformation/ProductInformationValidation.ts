import { ProductInformationStep } from "../../../../../../utils/types/pharmacy/Product/ProdcutCreateForm.ts";
import React from "react";

export const validateProductInformationFields = (
    data: ProductInformationStep,
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>,
) => {
    const newErrors: Record<string, string> = {};

    if (!data.sku) newErrors.sku = "Item Code / SKU is required.";
    if (!data.name) newErrors.name = "Item Name is required.";
    if (!data.genericName) newErrors.genericName = "Generic Name is required.";
    if (!data.brandName) newErrors.brandName = "Brand Name is required.";
    if (!data.category) newErrors.category = "Category is required.";
    if (!data.units) newErrors.units = "Units are required.";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
};

export const checkProductItemNameDuplication = (productItemNames: [], itemName: string) => {
    return productItemNames.some((productItemName: string) => productItemName === itemName)
}

export const checkProductItemCodeDuplication = (productItemCodes: [], itemCode: string) => {
    return productItemCodes.some((productCode: string) => productCode === itemCode)
}
