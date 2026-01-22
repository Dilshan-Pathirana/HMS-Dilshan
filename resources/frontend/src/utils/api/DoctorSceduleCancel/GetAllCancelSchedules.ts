import axios from "axios";

export const getAllCancelSchedules = () => {
    return axios.get(`/api/get-all-cancel-schedules`);
};
