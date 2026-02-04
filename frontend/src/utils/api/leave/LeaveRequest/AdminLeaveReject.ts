import api from "../../axios";

export const AdminLeaveReject =  async (data: { id: string; comments: string }) => {
    return api.post("api/admin-user-leave-reject",data);
};
