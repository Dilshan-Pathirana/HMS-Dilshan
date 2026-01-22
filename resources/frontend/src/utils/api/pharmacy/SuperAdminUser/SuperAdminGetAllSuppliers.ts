import axios from 'axios'

export const getAllSuperAdminSuppliers = () => {
    return axios.get('api/get-suppliers')
}
