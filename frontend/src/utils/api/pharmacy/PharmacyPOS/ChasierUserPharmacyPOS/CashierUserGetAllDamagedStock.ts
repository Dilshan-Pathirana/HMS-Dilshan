import api from "../../../axios";

export const getAllDamageStockDetails = () => {
    return api.get('api/cashier-get-damaged-product')
}
