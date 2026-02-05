import api from "../axios";

export const getUpdateUserDetails = (userId: string) => {
    return api.get(`/users/${userId}`);
};
