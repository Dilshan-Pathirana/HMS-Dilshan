import api from "../../axios";

export const PharmacistLeaveReject =  async (data: { id: string; comments: string }) => {
    return api.post("/hr/leave/reject",data);
};
