import api from "../axios";

export const getAllDoctorSchedules = (doctorId: string) => {
    return api.get(`/schedules/doctor/${doctorId}`);
};
