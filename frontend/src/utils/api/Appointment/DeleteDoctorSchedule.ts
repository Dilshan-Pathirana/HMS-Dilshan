import api from "../axios";

export const deleteDoctorSchedule = (scheduleId: string) => {
    return api.delete(`/schedules/${scheduleId}`);
};
