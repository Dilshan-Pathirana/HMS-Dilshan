import axios from 'axios'

export const getAllDamageStockDetails = () => {
    return axios.get('api/get-damaged-product')
}
