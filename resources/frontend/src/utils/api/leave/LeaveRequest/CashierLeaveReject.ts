import axios from "axios";

export const CashierLeaveReject =  async (data: { id: string; comments: string }) => {
    return axios.post("api/cashier-user-leave-reject",data);
};
