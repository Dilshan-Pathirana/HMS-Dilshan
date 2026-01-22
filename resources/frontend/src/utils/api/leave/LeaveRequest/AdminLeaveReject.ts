import axios from "axios";

export const AdminLeaveReject =  async (data: { id: string; comments: string }) => {
    return axios.post("api/admin-user-leave-reject",data);
};
