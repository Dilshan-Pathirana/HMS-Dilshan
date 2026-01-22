import axios from "axios";

export const getAllPharmacistLeave = (userId: string) => {
    return axios.get(`api/get-pharmacist-user-leaves/${userId}`);
};
