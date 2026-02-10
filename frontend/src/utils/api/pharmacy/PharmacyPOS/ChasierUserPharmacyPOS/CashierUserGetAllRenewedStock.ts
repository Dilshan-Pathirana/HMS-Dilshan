import api from "../../../axios";
import alert from "../../../../alert";

export const getAllTRenewedStock = () => {
    return api.get("api/cashier-get-product-renewed-stock").then((res: any) => {
        const list = res?.product_stock_event ?? res?.data?.product_stock_event;
        if (Array.isArray(list) && list.length === 0) {
            alert.warn("No renewed stock records available/found");
        }
        return res;
    });
};
