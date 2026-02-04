import api from "../../../axios";

export const getAllProducts = (userRole: number) => {
    if (userRole === 1) {
        return api.get("api/get-products");
    }

    if (userRole === 3) {
        return api.get("api/cashier-user-get-products");
    }

    if (userRole === 4) {
        return api.get("api/pharmacist-user-get-products");
    }
};
