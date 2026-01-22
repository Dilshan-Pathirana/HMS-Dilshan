import axios from "axios";

export const addOT = async (OTData: object) => {
    return axios.post("/api/create-employee-ot", OTData);
};
