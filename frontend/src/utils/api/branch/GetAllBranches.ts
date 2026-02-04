import api from "../axios";

export const getAllBranches = () => {
    return api.get(`/api/v1/branches`);
};
