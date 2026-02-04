import api from "../../axios";

export const getAllSuperAdminProducts = () => {
    return api.get('api/get-products')
}

export const getAllProductItemNamesAndItemCodesAdmin = () => {
    return api.get('api/get-product-item-name')
}

export const getAllProductItemNamesAndItemCodesPharmacist = () => {
    return api.get('api/pharmacist-get-product-item-name')
}
