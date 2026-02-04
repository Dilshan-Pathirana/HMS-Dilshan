import api from "../../axios";

export const getAllCashierLeaveRequest = (assignerId: string) => {
    return api.get(`api/get-cashier-user-leaves-request/${assignerId}`);
};
