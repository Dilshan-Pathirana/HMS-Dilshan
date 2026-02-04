import api from "../../axios";

export const getAllSuperAdminLeaveRequest = () => {
    return api.get(`api/get-admin-user-leaves-request`);
};
