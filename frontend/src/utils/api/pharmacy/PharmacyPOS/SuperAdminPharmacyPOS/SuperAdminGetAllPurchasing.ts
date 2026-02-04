import api from "../../../axios";

export const getAllPurchasing = () => {
    return api.get("api/get-purchasing-products");
};
