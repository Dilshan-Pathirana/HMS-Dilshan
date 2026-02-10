import api from "../../../axios";
import alert from "../../../../alert";

const warnIfEmptyDiscounts = (res: any) => {
    const list = res?.products_discounts ?? res?.data?.products_discounts;
    if (Array.isArray(list) && list.length === 0) {
        alert.warn("No discounts available/found");
    }
    return res;
};

export const getAllProductDiscount = (userRole: number) => {

    if (userRole === 1) {
        return api.get("api/get-product-discount").then(warnIfEmptyDiscounts);
    }

    if (userRole === 3) {
        return api.get("api/cashier-user-get-product-discount").then(warnIfEmptyDiscounts);
    }

    if (userRole === 4) {
        return api.get("api/pharmacist-user-get-product-discount").then(warnIfEmptyDiscounts);
    }
};

export const removeProductDiscount = (ProductDiscountID: string) => {
    return api.delete(`api/delete-product-discount/${ProductDiscountID}`);
};
