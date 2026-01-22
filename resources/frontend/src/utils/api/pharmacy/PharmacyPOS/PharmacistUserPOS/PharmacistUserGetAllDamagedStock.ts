import axios from 'axios'

export const getAllDamageStockDetails = () => {
    return axios.get('api/pharmacist-get-damaged-product')
}
