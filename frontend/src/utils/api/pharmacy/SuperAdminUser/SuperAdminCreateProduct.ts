import api from "../../axios";

export const createSuperAdminProduct = (postData: any) => {
    return api.post("api/create-product", postData);
};

export const createPharmacistProduct = (productData: any) => {
    return api.post("api/pharmacist-user-create-product", productData);
}
