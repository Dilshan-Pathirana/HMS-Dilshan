import axios from "axios";

export const getAllPharmacistLeaveRequest = (assignerId: string) => {
    return axios.get(`api/get-pharmacist-user-leaves-request/${assignerId}`);
};
