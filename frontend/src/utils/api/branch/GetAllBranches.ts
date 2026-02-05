import api from "../axios";

export const getAllBranches = () => {
    return api.get(`/branches`);
};
