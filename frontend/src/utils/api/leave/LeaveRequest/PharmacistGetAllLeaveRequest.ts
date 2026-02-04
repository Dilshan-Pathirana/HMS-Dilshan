import api from "../../axios";

export const getAllPharmacistLeaveRequest = (assignerId: string) => {
    return api.get(`api/get-pharmacist-user-leaves-request/${assignerId}`);
};
