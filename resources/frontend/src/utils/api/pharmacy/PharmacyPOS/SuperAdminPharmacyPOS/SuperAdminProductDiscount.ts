import axios from "axios";

export const getAllProductDiscount = (userRole: number) => {

    if (userRole === 1) {
        return axios.get("api/get-product-discount");
    }

    if (userRole === 3) {
        return axios.get("api/cashier-user-get-product-discount");
    }

    if (userRole === 4) {
        return axios.get("api/pharmacist-user-get-product-discount");
    }
};

export const removeProductDiscount = (ProductDiscountID: string) => {
    return axios.delete(`api/delete-product-discount/${ProductDiscountID}`);
};
