import axios from 'axios'


export const updateSuperAdminProduct = (productId: string, postData: any) => {
    return axios.post(`api/update-product/${productId}`, postData);
}
