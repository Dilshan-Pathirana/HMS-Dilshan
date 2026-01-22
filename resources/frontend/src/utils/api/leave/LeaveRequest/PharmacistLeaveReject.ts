import axios from "axios";

export const PharmacistLeaveReject =  async (data: { id: string; comments: string }) => {
    return axios.post("/api/pharmacist-user-leave-reject",data);
};
