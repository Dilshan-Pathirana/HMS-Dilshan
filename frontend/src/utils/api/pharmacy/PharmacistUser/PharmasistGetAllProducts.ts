import api from "../../axios";

export const getAllPharmacistProducts = () => {
    return api.get('api/pharmacist-user-get-products')
}

export const getAllPharmacistSuppliers = () => {
    return api.get('api/get-pharmacist-suppliers')
}


