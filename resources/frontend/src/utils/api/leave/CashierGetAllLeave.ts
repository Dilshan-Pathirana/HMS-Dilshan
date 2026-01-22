import axios from "axios";

export const getAllCashierLeave = (userId: string) => {
    return axios.get(`api/get-cashier-user-leaves/${userId}`);
};
