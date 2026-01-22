import axios from "axios";

export const getAllPurchasing = () => {
    return axios.get("api/get-purchasing-products");
};
