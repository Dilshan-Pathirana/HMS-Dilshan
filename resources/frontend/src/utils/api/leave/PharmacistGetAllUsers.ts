import axios from "axios";

export const getPharmacistUser = () => {
    return axios.get(`api/pharmacist-get-all-users`);
};
