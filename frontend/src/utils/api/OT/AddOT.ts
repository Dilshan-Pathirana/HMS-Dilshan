import api from "../axios";

export const addOT = async (OTData: object) => {
    return api.post("/hr/overtime", OTData);
};
