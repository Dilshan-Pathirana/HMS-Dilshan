import api from "../../../axios";

export const addTransferStockCashierUser = (
    product_id: string,
    transfer_stock: number | string,
    event_reason: string,
) => {
    return api.post("api/cashier-add-product-transfer-stock", {
        product_id,
        transfer_stock,
        event_reason,
    });
};
