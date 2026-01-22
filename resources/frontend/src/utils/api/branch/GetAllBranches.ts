import axios from "axios";

export const getAllBranches = () => {
    return axios.get(`/api/get-branches`);
};
