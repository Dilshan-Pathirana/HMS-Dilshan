import axios from "axios";

export const addDoctorSchedule = async (scheduleData: object) => {
    return axios.post("/api/create-doctor-schedule", scheduleData);
};
