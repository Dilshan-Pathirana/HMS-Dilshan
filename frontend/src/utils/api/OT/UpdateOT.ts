import api from "../axios";

export const updateOT = async (id: string, OTUpdateData: object) => {
    return api.put(`/update-employee-ot/${id}`, OTUpdateData);
};
