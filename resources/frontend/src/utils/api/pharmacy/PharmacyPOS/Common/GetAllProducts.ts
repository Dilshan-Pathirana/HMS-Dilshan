import axios from "axios";

export const getAllProducts = (userRole: number) => {
    if (userRole === 1) {
        return axios.get("api/get-products");
    }

    if (userRole === 3) {
        return axios.get("api/cashier-user-get-products");
    }

    if (userRole === 4) {
        return axios.get("api/pharmacist-user-get-products");
    }
};
