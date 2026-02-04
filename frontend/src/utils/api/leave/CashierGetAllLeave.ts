import api from "../axios";

export const getAllCashierLeave = (userId: string) => {
    return api.get(`api/get-cashier-user-leaves/${userId}`);
};
