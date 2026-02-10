import api from "../../../axios";
import alert from "../../../../alert";

export const getAllProducts = (userRole: number) => {
    if (userRole === 1) {
        return api.get("api/get-products").then((res: any) => {
            const products = res?.data?.products;
            if (res?.data?.status === 200 && Array.isArray(products) && products.length === 0) {
                alert.warn("No products available/found");
            }
            return res;
        });
    }

    if (userRole === 3) {
        return api.get("api/cashier-user-get-products").then((res: any) => {
            const products = res?.data?.products;
            if (res?.data?.status === 200 && Array.isArray(products) && products.length === 0) {
                alert.warn("No products available/found");
            }
            return res;
        });
    }

    if (userRole === 4) {
        return api.get("api/pharmacist-user-get-products").then((res: any) => {
            const products = res?.data?.products;
            if (res?.data?.status === 200 && Array.isArray(products) && products.length === 0) {
                alert.warn("No products available/found");
            }
            return res;
        });
    }
};
