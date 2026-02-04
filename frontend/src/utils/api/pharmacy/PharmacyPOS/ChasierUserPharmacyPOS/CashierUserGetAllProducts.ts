import api from "../../../axios";

export const getAllProducts = () => {
    return api.get("api/cashier-user-get-products");
};
