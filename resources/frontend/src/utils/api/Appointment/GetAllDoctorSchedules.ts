import axios from "axios";

export const getAllDoctorSchedules = () => {
    return axios.get(`api/get-all-doctor-schedule`);
};
