import api from "../axios";

export const getAllCancelSchedules = () => {
    return api.get(`/get-all-cancel-schedules`);
};
