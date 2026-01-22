import axios from "axios";

export const getAllOTRecords = () => {
    return axios.get(`/api/get-all-employee-ot`);
};
