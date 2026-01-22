import axios from "axios";

export const CashierLeaveApprove = async (data: { id: string; comments: string }) => {
    return axios.post("/api/cashier-user-leave-approve",data);
};
