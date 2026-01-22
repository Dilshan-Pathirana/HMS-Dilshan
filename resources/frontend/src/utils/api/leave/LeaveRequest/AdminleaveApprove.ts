import axios from "axios";

export const AdminLeaveApprove = async (data: { id: string; comments: string }) => {
    return axios.post("/api/admin-user-leave-approve",data);
};
