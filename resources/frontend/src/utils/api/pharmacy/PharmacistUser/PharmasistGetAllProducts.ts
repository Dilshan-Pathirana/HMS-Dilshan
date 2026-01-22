import axios from 'axios'

export const getAllPharmacistProducts = () => {
    return axios.get('api/pharmacist-user-get-products')
}

export const getAllPharmacistSuppliers = () => {
    return axios.get('api/get-pharmacist-suppliers')
}


