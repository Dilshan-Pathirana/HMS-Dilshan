import axios from "axios";

export const getAllCashierLeaveRequest = (assignerId: string) => {
    return axios.get(`api/get-cashier-user-leaves-request/${assignerId}`);
};
