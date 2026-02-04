import api from "../../../axios";

export const purchasingProductCashierUser = (purchasingProductsBillDetails: any) => {
    return api.post("api/cashier-purchasing-product", purchasingProductsBillDetails);
};
