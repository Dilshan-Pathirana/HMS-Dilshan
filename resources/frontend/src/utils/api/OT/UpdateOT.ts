import axios from "axios";

export const updateOT = async (id: string, OTUpdateData: object) => {
    return axios.put(`/api/update-employee-ot/${id}`, OTUpdateData);
};
