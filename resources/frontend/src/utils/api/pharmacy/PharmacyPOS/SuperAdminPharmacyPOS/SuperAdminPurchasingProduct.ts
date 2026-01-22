import axios from "axios";

export const purchasingProductSuperAdmin = (purchasingProductsBillDetails: any) => {
    return axios.post("api/purchasing-product", purchasingProductsBillDetails);
};
