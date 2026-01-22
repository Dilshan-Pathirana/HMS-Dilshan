import axios from "axios";

export const addPharmacistLeave = async (leaveData: object) => {
    return axios.post("/api/pharmacist-user-add-leave", leaveData);
};
