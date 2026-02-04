import api from "../../../axios";

export const getAllTRenewedStock = () => {
    return api.get("api/cashier-get-product-renewed-stock");
};
