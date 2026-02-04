import api from "../axios";

export const getUpdateUserDetails = (userId: string) => {
    return api.get(`/api/v1/users/${userId}`);
};
