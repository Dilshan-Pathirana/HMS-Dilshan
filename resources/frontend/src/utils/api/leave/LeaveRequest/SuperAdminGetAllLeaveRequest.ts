import axios from "axios";

export const getAllSuperAdminLeaveRequest = () => {
    return axios.get(`api/get-admin-user-leaves-request`);
};
