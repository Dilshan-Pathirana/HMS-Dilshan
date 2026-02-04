import api from "../axios";

export const getAllCashierUser = () => {
    return api.get(`api/cashier-get-all-users`);
};
