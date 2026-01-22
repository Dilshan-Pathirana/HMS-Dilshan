import axios from 'axios'

export const getAllDamageStockDetails = () => {
    return axios.get('api/cashier-get-damaged-product')
}
