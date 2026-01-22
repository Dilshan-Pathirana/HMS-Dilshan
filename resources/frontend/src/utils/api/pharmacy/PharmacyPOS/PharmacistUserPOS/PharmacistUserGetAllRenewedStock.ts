import axios from "axios";

export const getAllTRenewedStock = () => {
    return axios.get("api/pharmacist-get-product-renewed-stock");
};
