import api from "../../axios";

export const PharmacistLeaveApprove =  async (data: { id: string; comments: string }) => {
    return api.post("/hr/leave/approve",data);
};
