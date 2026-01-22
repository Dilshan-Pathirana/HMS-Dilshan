import axios from "axios";
import { IProductRestock } from "../../../../types/pos/IProductRestock";
export const addReOrderStock = (
    productStockDetails: IProductRestock,
    userRole: number,
) => {
    if (userRole === 1) {
        return axios.post("api/update-product-stock", productStockDetails);
    }

    if (userRole === 3) {
        return axios.post(
            "api/cashier-update-product-stock",
            productStockDetails,
        );
    }

    if (userRole === 4) {
        return axios.post(
            "api/pharmacist-update-product-stock",
            productStockDetails,
        );
    }
};
