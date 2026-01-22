import axios from "axios";

export const deleteDoctorSchedule = (scheduleId: string) => {
    return axios.delete(`api/delete-doctor-schedule/${scheduleId}`);
};
