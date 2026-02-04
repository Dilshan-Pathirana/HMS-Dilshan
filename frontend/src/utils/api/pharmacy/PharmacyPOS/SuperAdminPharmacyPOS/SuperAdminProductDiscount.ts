import api from "../../../axios";

export const getAllProductDiscount = (userRole: number) => {

    if (userRole === 1) {
        return api.get("api/get-product-discount");
    }

    if (userRole === 3) {
        return api.get("api/cashier-user-get-product-discount");
    }

    if (userRole === 4) {
        return api.get("api/pharmacist-user-get-product-discount");
    }
};

export const removeProductDiscount = (ProductDiscountID: string) => {
    return api.delete(`api/delete-product-discount/${ProductDiscountID}`);
};
