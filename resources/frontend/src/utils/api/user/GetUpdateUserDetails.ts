import axios from "axios";

export const getUpdateUserDetails = (userId: string) => {
    return axios.get(`/api/get-users-details-for-update/${userId}`);
};
