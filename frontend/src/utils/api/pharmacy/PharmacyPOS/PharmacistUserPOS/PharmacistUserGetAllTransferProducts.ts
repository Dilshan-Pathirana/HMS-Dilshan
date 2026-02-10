import api from "../../../axios";
import alert from "../../../../alert";

export const getAllTransferProducts = () => {
    return api.get("api/pharmacist-get-transfer-product").then((res: any) => {
        const list = res?.product_stock_event ?? res?.data?.product_stock_event;
        if (Array.isArray(list) && list.length === 0) {
            alert.warn("No transfer products available/found");
        }
        return res;
    });
};
