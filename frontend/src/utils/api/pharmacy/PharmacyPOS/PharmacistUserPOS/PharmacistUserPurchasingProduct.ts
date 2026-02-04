import api from "../../../axios";

export const purchasingProductPharmacistUser = (purchasingProductsBillDetails: any) => {
    return api.post("api/pharmacist-user-purchasing-product", purchasingProductsBillDetails);
};
