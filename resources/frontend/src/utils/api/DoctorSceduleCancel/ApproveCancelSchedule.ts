import axios from "axios";

export const approveCancelSchedule = (id: string) => {
    return axios.post(`/api/approve-cancel-schedule/${id}`);
};
