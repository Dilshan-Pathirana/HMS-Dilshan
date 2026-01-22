import axios from "axios";

export const createSuperAdminProduct = (postData: any) => {
    return axios.post("api/create-product", postData);
};

export const createPharmacistProduct = (productData: any) => {
    return axios.post("api/pharmacist-user-create-product", productData);
}
