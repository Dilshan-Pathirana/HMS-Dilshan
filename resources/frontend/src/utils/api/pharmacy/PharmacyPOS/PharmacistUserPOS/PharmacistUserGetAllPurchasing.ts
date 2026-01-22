import axios from "axios";

export const getAllPurchasing = () => {
    return axios.get("api/pharmacist-user-get-purchasing-products");
};
