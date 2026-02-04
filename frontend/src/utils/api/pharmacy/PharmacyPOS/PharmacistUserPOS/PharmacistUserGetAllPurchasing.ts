import api from "../../../axios";

export const getAllPurchasing = () => {
    return api.get("api/pharmacist-user-get-purchasing-products");
};
