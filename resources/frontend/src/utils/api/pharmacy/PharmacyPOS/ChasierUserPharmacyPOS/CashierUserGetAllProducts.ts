import axios from "axios";

export const getAllProducts = () => {
    return axios.get("api/cashier-user-get-products");
};
