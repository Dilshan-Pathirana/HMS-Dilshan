import axios from "axios";

export const getAllTRenewedStock = () => {
    return axios.get("api/get-product-renewed-stock");
};
