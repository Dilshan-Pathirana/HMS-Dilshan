import axios from "axios";
import { getAllProducts } from "../../../../utils/api/pharmacy/PharmacyPOS/Common/GetAllProducts.ts";
import {
    Product,
    ProductOptionToDropDown,
} from "../../../../utils/types/pos/IProduct.ts";
import alert from "../../../../utils/alert.ts";
import api from "../../../../utils/api/axios";
import React, { SetStateAction } from "react";

export const fetchAllProducts = async (
    userRole: number,
    setIsLoading: React.Dispatch<SetStateAction<boolean>>,
    setProductOptions: React.Dispatch<
        SetStateAction<ProductOptionToDropDown[]>
    >,
) => {
    setIsLoading(true);
    try {
        const response = await getAllProducts(userRole);
        if (response?.data.status === 200) {
            const options = response.data.products.map((product: Product) => ({
                value: product.id,
                label: product.item_name,
            }));
            setProductOptions(options);
        } else {
            alert.warn("Failed to fetch product list.");
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            alert.warn("Failed to fetch product list: " + error.message);
        } else {
            alert.warn("Failed to fetch product list.");
        }
    }
    setIsLoading(false);
};
