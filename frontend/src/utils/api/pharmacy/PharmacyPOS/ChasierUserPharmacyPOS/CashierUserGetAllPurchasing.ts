import api from "../../../axios";
import alert from "../../../../alert";

export const getAllPurchasing = () => {
    return api.get("api/cashier-get-purchasing-products").then((res: any) => {
        const list = res?.data?.purchasing;
        if (res?.data?.status === 200 && Array.isArray(list) && list.length === 0) {
            alert.warn("No purchasing records available/found");
        }
        return res;
    });
};
