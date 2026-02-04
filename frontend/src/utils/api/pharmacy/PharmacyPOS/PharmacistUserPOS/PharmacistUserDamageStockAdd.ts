import api from "../../../axios";

export const addDamageStockPharmacistUser = (
    product_id: string,
    damaged_stock: number | string,
    event_reason: string,
) => {
    return api.post("api/pharmacist-add-product-damaged-stock", {
        product_id,
        damaged_stock,
        event_reason,
    });
};
