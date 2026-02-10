import api from "../../../axios";
import alert from "../../../../alert";

export const getAllDamageStockDetails = () => {
    return api.get('api/get-damaged-product').then((res: any) => {
        const list = res?.product_stock_event ?? res?.data?.product_stock_event;
        if (Array.isArray(list) && list.length === 0) {
            alert.warn("No damaged products available/found");
        }
        return res;
    })
}
