import api from "../axios";

export const deleteDoctorSchedule = (scheduleId: string) => {
    return api.delete(`api/delete-doctor-schedule/${scheduleId}`);
};
