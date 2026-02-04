import api from "../../axios";

export const AdminLeaveApprove = async (data: { id: string; comments: string }) => {
    return api.post("/hr/leave/approve",data);
};
