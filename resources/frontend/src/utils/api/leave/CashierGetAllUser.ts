import axios from "axios";

export const getAllCashierUser = () => {
    return axios.get(`api/cashier-get-all-users`);
};
