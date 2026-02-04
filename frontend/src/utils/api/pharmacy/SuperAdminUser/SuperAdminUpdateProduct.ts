import api from "../../axios";


export const updateSuperAdminProduct = (productId: string, postData: any) => {
    return api.post(`api/update-product/${productId}`, postData);
}
