import api from "../../../axios";

export const getAllPurchasing = () => {
    return api.get("api/cashier-get-purchasing-products");
};
