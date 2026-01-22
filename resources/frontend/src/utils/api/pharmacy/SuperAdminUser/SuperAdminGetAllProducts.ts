import axios from 'axios'

export const getAllSuperAdminProducts = () => {
    return axios.get('api/get-products')
}

export const getAllProductItemNamesAndItemCodesAdmin = () => {
    return axios.get('api/get-product-item-name')
}

export const getAllProductItemNamesAndItemCodesPharmacist = () => {
    return axios.get('api/pharmacist-get-product-item-name')
}
