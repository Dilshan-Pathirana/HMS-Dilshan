import api from "../../../axios";

export const getAllTRenewedStock = () => {
    return api.get("api/pharmacist-get-product-renewed-stock");
};
