import axios from "axios";

export const purchasingProductCashierUser = (purchasingProductsBillDetails: any) => {
    return axios.post("api/cashier-purchasing-product", purchasingProductsBillDetails);
};
