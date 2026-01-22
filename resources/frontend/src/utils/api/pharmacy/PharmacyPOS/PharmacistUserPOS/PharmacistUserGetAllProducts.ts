import axios from "axios";

export const getAllProducts = () => {
    return axios.get("api/pharmacist-user-get-products");
};
