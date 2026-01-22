import { SupplierInfo } from "../../../../../utils/types/pharmacy/Product/ProdcutCreateForm.ts";
import React from "react";

export const validateForm = (
    supplierInfo: SupplierInfo,
    setErrors: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>,
) => {
    const newErrors: { [key: string]: string } = {};
    if (!supplierInfo.supplier_name)
        newErrors.supplier_name = "Supplier Name is required";
    if (!supplierInfo.contact_number)
        newErrors.contact_number = "Contact Number is required";
    if (!supplierInfo.contact_email)
        newErrors.contact_email = "Email is required";
    if (!supplierInfo.products_supplied)
        newErrors.products_supplied = "Products Supplied is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
};
