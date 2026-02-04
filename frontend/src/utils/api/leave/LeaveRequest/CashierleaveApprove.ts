import api from "../../axios";

export const CashierLeaveApprove = async (data: { id: string; comments: string }) => {
    return api.post("/hr/leave/approve",data);
};
