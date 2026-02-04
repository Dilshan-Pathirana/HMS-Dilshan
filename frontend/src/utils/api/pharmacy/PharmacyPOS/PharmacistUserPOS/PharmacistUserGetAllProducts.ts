import api from "../../../axios";

export const getAllProducts = () => {
    return api.get("api/pharmacist-user-get-products");
};
