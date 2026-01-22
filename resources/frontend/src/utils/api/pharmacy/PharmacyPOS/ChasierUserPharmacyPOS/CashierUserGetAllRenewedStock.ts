import axios from "axios";

export const getAllTRenewedStock = () => {
    return axios.get("api/cashier-get-product-renewed-stock");
};
