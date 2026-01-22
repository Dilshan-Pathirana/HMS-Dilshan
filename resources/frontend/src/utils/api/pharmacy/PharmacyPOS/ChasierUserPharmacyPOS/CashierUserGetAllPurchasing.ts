import axios from "axios";

export const getAllPurchasing = () => {
    return axios.get("api/cashier-get-purchasing-products");
};
