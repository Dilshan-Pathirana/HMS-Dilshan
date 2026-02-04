import api from "../../../axios";

export const purchasingProductSuperAdmin = (purchasingProductsBillDetails: any) => {
    return api.post("api/purchasing-product", purchasingProductsBillDetails);
};
