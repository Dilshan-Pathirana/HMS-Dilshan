import api from "../axios";

export const getAllOTRecords = () => {
    return api.get(`/hr/overtime`);
};
