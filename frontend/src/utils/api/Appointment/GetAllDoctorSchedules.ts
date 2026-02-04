import api from "../axios";

export const getAllDoctorSchedules = () => {
    return api.get(`api/get-all-doctor-schedule`);
};
