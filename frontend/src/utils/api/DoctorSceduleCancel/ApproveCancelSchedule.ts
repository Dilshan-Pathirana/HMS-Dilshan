import api from "../axios";

export const approveCancelSchedule = (id: string) => {
    return api.post(`/schedules/cancel/approve/${id}`);
};
