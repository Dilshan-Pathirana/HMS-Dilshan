import { getAllProductItemNamesAndItemCodesAdmin } from "../../../../../../utils/api/pharmacy/SuperAdminUser/SuperAdminGetAllProducts.ts";
import React from "react";

export const fetchProductItemNamesAndItemCodes = async (
    setProductItemNames: React.Dispatch<React.SetStateAction<[]>>,
    setProductCodes: React.Dispatch<React.SetStateAction<[]>>,
) => {
    const response = await getAllProductItemNamesAndItemCodesAdmin().then();

    if (response.status === 200) {
        const { product_names, product_codes } = response.data;
        setProductItemNames(product_names);
        setProductCodes(product_codes);
    }
};
