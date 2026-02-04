import api from "../../../axios";

export const getAllTRenewedStock = () => {
    return api.get("api/get-product-renewed-stock");
};
