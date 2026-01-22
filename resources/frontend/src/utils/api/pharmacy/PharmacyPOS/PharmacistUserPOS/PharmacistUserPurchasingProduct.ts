import axios from "axios";

export const purchasingProductPharmacistUser = (purchasingProductsBillDetails: any) => {
    return axios.post("api/pharmacist-user-purchasing-product", purchasingProductsBillDetails);
};
