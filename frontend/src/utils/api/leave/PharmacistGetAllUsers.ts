import api from "../axios";

export const getPharmacistUser = () => {
    return api.get(`api/pharmacist-get-all-users`);
};
