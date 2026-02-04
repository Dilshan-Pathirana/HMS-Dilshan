import api from "../axios";

export const getAllPharmacistLeave = (userId: string) => {
    return api.get(`api/get-pharmacist-user-leaves/${userId}`);
};
