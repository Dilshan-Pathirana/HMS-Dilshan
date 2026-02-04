import api from "../axios";

export const addPharmacistLeave = async (leaveData: object) => {
    return api.post("/hr/leave", leaveData);
};
