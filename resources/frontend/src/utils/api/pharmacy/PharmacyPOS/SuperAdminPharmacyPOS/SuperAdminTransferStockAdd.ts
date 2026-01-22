import axios from "axios";

export const addTransferStockSuperAdmin = (
    product_id: string,
    transfer_stock: number | string,
    event_reason: string,
) => {
    return axios.post("api/add-product-transfer-stock", {
        product_id,
        transfer_stock,
        event_reason,
    });
};
