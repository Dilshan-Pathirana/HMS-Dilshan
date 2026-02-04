import api from "../../../axios";

export const getAllDamageStockDetails = () => {
    return api.get('api/pharmacist-get-damaged-product')
}
