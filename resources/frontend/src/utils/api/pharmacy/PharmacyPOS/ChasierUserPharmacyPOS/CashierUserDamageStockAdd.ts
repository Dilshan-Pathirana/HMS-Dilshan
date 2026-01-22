import axios from "axios";

export const addDamageStockCashierUser = (
    product_id: string,
    damaged_stock: number | string,
    event_reason: string,
) => {
    return axios.post("api/cashier-add-product-damaged-stock", {
        product_id,
        damaged_stock,
        event_reason,
    });
};
