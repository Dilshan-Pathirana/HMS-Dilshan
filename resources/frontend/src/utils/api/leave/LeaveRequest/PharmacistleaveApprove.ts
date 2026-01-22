import axios from "axios";

export const PharmacistLeaveApprove =  async (data: { id: string; comments: string }) => {
    return axios.post("/api/pharmacist-user-leave-approve",data);
};
