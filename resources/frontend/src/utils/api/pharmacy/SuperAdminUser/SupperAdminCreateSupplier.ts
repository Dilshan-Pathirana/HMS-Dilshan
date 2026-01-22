import axios from 'axios'

export const createSuperAdminSupplier = (supplierInfo: any) => {
    return axios.post('api/create-supplier',supplierInfo);
}

export const createPharmacistSupplier = (supplierInfo: any) => {
    return axios.post('api/create-pharmacist-supplier',supplierInfo);
}
