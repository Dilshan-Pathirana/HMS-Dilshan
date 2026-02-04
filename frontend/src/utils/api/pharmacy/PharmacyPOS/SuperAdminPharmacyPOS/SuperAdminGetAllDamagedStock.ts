import api from "../../../axios";

export const getAllDamageStockDetails = () => {
    return api.get('api/get-damaged-product')
}
