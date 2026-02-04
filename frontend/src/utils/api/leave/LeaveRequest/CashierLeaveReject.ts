import api from "../../axios";

export const CashierLeaveReject =  async (data: { id: string; comments: string }) => {
    return api.post("api/cashier-user-leave-reject",data);
};
