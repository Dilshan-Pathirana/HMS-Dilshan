import api from "../../../axios";

export const addDamageStockSuperAdmin = (
    product_id: string,
    damaged_stock: number | string,
    event_reason: string,
) => {
    return api.post("api/add-product-damaged-stock", {
        product_id,
        damaged_stock,
        event_reason,
    });
};
