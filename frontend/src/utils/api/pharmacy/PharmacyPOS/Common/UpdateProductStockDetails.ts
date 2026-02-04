import api from "../../../axios";
import { IProductRestock } from "../../../../types/pos/IProductRestock";
export const addReOrderStock = (
    productStockDetails: IProductRestock,
    userRole: number,
) => {
    if (userRole === 1) {
        return api.post("api/update-product-stock", productStockDetails);
    }

    if (userRole === 3) {
        return api.post(
            "api/cashier-update-product-stock",
            productStockDetails,
        );
    }

    if (userRole === 4) {
        return api.post(
            "api/pharmacist-update-product-stock",
            productStockDetails,
        );
    }
};
